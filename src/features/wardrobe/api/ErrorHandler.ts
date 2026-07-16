import { SupabaseClient } from "@supabase/supabase-js";

export interface ErrorResult {
  success: false;
  code: string;
  message: string;
  retryable: boolean;
}

export class ErrorHandler {
  static async executeWithRetry<T>(
    supabase: SupabaseClient,
    operation: () => Promise<T>,
    context: string = "operation"
  ): Promise<T> {
    let attempt = 0;
    let delay = 1000;

    while (true) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        
        // Analyze error type
        const status = error?.status || error?.statusCode || 500;
        const errorMessage = error?.message || String(error);
        
        const isTransient = status >= 500 || status === 429 || errorMessage.includes("timeout") || errorMessage.includes("network");
        const isClientError = status >= 400 && status < 500 && status !== 429;
        
        let maxRetries = 0;
        if (isTransient) maxRetries = 3;
        else if (status === 400 || status === 401) maxRetries = 1;
        
        if (attempt > maxRetries || status === 403 || status === 404 || errorMessage.toLowerCase().includes("invalid image")) {
          // Log permanent failure to analytics
          this.logErrorToAnalytics(supabase, context, error, attempt, false);
          throw this.formatError(error);
        }

        // Log retryable error
        this.logErrorToAnalytics(supabase, context, error, attempt, true);
        
        // Wait with exponential backoff
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // 1s, 2s, 4s, 8s
      }
    }
  }

  static formatError(error: any): ErrorResult {
    const status = error?.status || 500;
    const msg = (error?.message || "").toLowerCase();
    
    let userMessage = "Analysis failed. Please try again.";
    let retryable = true;
    
    if (msg.includes("too small") || msg.includes("invalid image")) {
      userMessage = "Image too small. Please use a clearer photo.";
      retryable = false;
    } else if (msg.includes("background removal")) {
      userMessage = "Background removal failed. Try a simpler background.";
    } else if (msg.includes("timeout") || msg.includes("network")) {
      userMessage = "Network timeout. Check connection and retry.";
    } else if (status === 429) {
      userMessage = "Rate limited. Try again in 5 minutes.";
    } else if (status === 403 || status === 404) {
      retryable = false;
    }

    return {
      success: false,
      code: status.toString(),
      message: userMessage,
      retryable,
    };
  }

  private static logErrorToAnalytics(supabase: SupabaseClient, context: string, error: any, attempt: number, retryable: boolean) {
    // Fire and forget logging
    supabase.from("analytics_logs").insert([{
      event_type: "cloth_scan_error",
      context,
      error_message: error?.message || String(error),
      attempt,
      retryable,
      created_at: new Date().toISOString()
    }]).then(({ error: dbError }: { error: any }) => {
      if (dbError) console.error("Failed to log error to analytics", dbError);
    });
  }
}

import { useLocalRuntime, ChatModelAdapter } from "@assistant-ui/react-native";
import { supabase } from "@/shared/supabase/client";
import { zodToJsonSchema } from "zod-to-json-schema";

export function useStylistRuntime() {
  const chatModelAdapter: ChatModelAdapter = {
    async *run({ messages, abortSignal, context }) {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      // Prepare tools
      const openAiTools = context.tools ? Object.entries(context.tools).map(([name, tool]) => {
         // Convert Zod schema to JSON Schema for OpenAI
         // assistant-ui passes the raw Zod schema as tool.parameters
         const jsonSchema = tool.parameters ? zodToJsonSchema(tool.parameters as any) : undefined;
         if (jsonSchema && '$schema' in jsonSchema) delete (jsonSchema as any).$schema;
         
         return {
          type: "function",
          function: {
            name,
            description: tool.description,
            parameters: jsonSchema
          }
         };
      }) : undefined;

      const openAiMessages = messages.map((msg: any) => {
        const content = msg.content.map((c: any) => {
          if (c.type === "text") return { type: "text", text: c.text };
          return null;
        }).filter(Boolean);

        if (msg.role === "user") {
           // check if there are tool results
           const toolResults = msg.content.filter((c: any) => c.type === "tool-result");
           if (toolResults.length > 0) {
             return toolResults.map((c: any) => ({
               role: "tool",
               tool_call_id: c.toolCallId,
               content: typeof c.result === 'string' ? c.result : JSON.stringify(c.result)
             }));
           }
           return { role: "user", content: msg.content.map((c: any) => c.type === "text" ? c.text : "").join("\n") };
        } else if (msg.role === "assistant") {
           const toolCalls = msg.content.filter((c: any) => c.type === "tool-call");
           return {
             role: "assistant",
             content: msg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n") || null,
             tool_calls: toolCalls.length > 0 ? toolCalls.map((c: any) => ({
               id: c.toolCallId,
               type: "function",
               function: { name: c.toolName, arguments: JSON.stringify(c.args) }
             })) : undefined
           };
        }
        return { role: msg.role, content: msg.content.map((c: any) => c.text).join("\n") };
      }).flat();

      if (context.system) {
        openAiMessages.unshift({ role: "system", content: context.system });
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/openai-proxy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            stream: false,
            messages: openAiMessages,
            tools: openAiTools?.length ? openAiTools : undefined
          }),
          signal: abortSignal
        }
      );

      if (!response.ok) {
        throw new Error(`Edge function returned ${response.status}`);
      }

      const data = await response.json();
      const msg = data.choices[0]?.message;

      const content = [];
      if (msg?.content) {
        content.push({ type: "text", text: msg.content });
      }

      if (msg?.tool_calls) {
        for (const tc of msg.tool_calls) {
          content.push({
            type: "tool-call",
            toolCallId: tc.id,
            toolName: tc.function.name,
            args: JSON.parse(tc.function.arguments || "{}")
          });
        }
      }

      yield {
        content: content as any
      };
    }
  };

  return useLocalRuntime(chatModelAdapter);
}

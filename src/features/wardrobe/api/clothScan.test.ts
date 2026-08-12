
import { saveClothToWardrobe } from './saveClothToWardrobe';
import { SupabaseClient } from '@supabase/supabase-js';

describe('saveClothToWardrobe', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    };
  });

  it('should successfully save cloth item', async () => {
    // Setup mock return
    const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'item-123' }, error: null });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    // saveClothToWardrobe first ensures the user_profiles row via upsert(), then
    // inserts the wardrobe_item via insert().select().single().
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return { upsert: jest.fn().mockResolvedValue({ data: null, error: null }) };
      }
      return { insert: mockInsert };
    });

    const analysisResult = {
      success: true,
      original_url: 'https://fake-url.com/orig.jpg',
      bg_removed_url: 'https://fake-url.com/bg.png',
      form_fields: {
        season: 'Summer',
        category: 'Top',
        color: 'Red',
      },
      raw_gemini_vision: {},
      raw_gemini_flash: {}
    };

    const result = await saveClothToWardrobe(mockSupabase as SupabaseClient, analysisResult, 'camera', 'user-1');

    expect(result.success).toBe(true);
    expect(result.itemId).toBe('item-123');
    expect(mockSupabase.from).toHaveBeenCalledWith('wardrobe_items');
    expect(mockInsert).toHaveBeenCalled();
  });

  it('should handle API failure correctly', async () => {
    const analysisResult = {
      success: false,
      error: 'API Rate limited'
    };

    const result = await saveClothToWardrobe(mockSupabase as SupabaseClient, analysisResult, 'camera', 'user-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('API Rate limited');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});

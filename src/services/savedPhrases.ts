import { supabase } from './supabase';
import { SavedPhrase } from '../types/database';

// Get user's saved phrases
export const getUserSavedPhrases = async (userId: string): Promise<SavedPhrase[]> => {
  const { data, error } = await supabase
    .from('saved_phrases')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching saved phrases:', error);
    return [];
  }

  return data;
};

// Add a saved phrase
export const addSavedPhrase = async (
  userId: string,
  phraseText: string,
  displayOrder?: number
): Promise<SavedPhrase | null> => {
  // If no display_order provided, get the max order and add 1
  let order = displayOrder;
  if (order === undefined) {
    const { data: existing } = await supabase
      .from('saved_phrases')
      .select('display_order')
      .eq('user_id', userId)
      .order('display_order', { ascending: false })
      .limit(1);

    order = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;
  }

  const { data, error } = await supabase
    .from('saved_phrases')
    .insert({
      user_id: userId,
      phrase_text: phraseText,
      display_order: order,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding saved phrase:', error);
    return null;
  }

  return data;
};

// Update a saved phrase
export const updateSavedPhrase = async (
  phraseId: string,
  phraseText: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('saved_phrases')
    .update({
      phrase_text: phraseText,
      updated_at: new Date().toISOString(),
    })
    .eq('id', phraseId);

  if (error) {
    console.error('Error updating saved phrase:', error);
    return false;
  }

  return true;
};

// Delete a saved phrase
export const deleteSavedPhrase = async (phraseId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('saved_phrases')
    .delete()
    .eq('id', phraseId);

  if (error) {
    console.error('Error deleting saved phrase:', error);
    return false;
  }

  return true;
};

// Reorder saved phrases
export const reorderSavedPhrases = async (
  userId: string,
  phraseOrders: { id: string; display_order: number }[]
): Promise<boolean> => {
  // Update each phrase with its new order
  const updates = phraseOrders.map((item) =>
    supabase
      .from('saved_phrases')
      .update({ display_order: item.display_order })
      .eq('id', item.id)
      .eq('user_id', userId)
  );

  try {
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Error reordering saved phrases:', error);
    return false;
  }
};

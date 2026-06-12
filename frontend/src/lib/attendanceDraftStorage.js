/**
 * Utilitário para salvar e recuperar dados do formulário de atendimento
 * Previne perda de dados quando há erro de autenticação
 */

const ATTENDANCE_DRAFT_KEY = 'deskhub_attendance_draft';
const ATTENDANCE_DRAFT_TIMESTAMP_KEY = 'deskhub_attendance_draft_timestamp';
const ATTENDANCE_DRAFT_EDITING_ID_KEY = 'deskhub_attendance_draft_editing_id';

export const attendanceDraftStorage = {
  /**
   * Salva rascunho do formulário e editingId no localStorage
   */
  saveDraft(formData, editingId = null) {
    try {
      localStorage.setItem(ATTENDANCE_DRAFT_KEY, JSON.stringify(formData));
      localStorage.setItem(ATTENDANCE_DRAFT_TIMESTAMP_KEY, new Date().toISOString());
      if (editingId) {
        localStorage.setItem(ATTENDANCE_DRAFT_EDITING_ID_KEY, editingId);
      } else {
        localStorage.removeItem(ATTENDANCE_DRAFT_EDITING_ID_KEY);
      }
    //   console.log('Rascunho salvo no localStorage');
    } catch (err) {
      console.error('Erro ao salvar rascunho:', err);
    }
  },

  /**
   * Recupera rascunho do localStorage
   */
  getDraft() {
    try {
      const draft = localStorage.getItem(ATTENDANCE_DRAFT_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch (err) {
      console.error('Erro ao recuperar rascunho:', err);
      return null;
    }
  },

  /**
   * Recupera o editingId do rascunho
   */
  getDraftEditingId() {
    try {
      return localStorage.getItem(ATTENDANCE_DRAFT_EDITING_ID_KEY);
    } catch (err) {
      console.error('Erro ao recuperar editingId do rascunho:', err);
      return null;
    }
  },

  /**
   * Remove rascunho do localStorage
   */
  clearDraft() {
    try {
      localStorage.removeItem(ATTENDANCE_DRAFT_KEY);
      localStorage.removeItem(ATTENDANCE_DRAFT_TIMESTAMP_KEY);
    //   console.log('Rascunho removido do localStorage');
    } catch (err) {
      console.error('Erro ao limpar rascunho:', err);
    }
  },

  /**
   * Verifica se há rascunho disponível
   */
  hasDraft() {
    return !!localStorage.getItem(ATTENDANCE_DRAFT_KEY);
  },

  /**
   * Retorna o timestamp do rascunho
   */
  getDraftTimestamp() {
    return localStorage.getItem(ATTENDANCE_DRAFT_TIMESTAMP_KEY);
  }
};

import client from '../client';
import type { ApiResponse } from '../client';

interface WhatsAppQR {
  qr_code_base64: string;
  session_id: string;
  status: string;
}

interface WhatsAppStatus {
  status: string;
  phone_number?: string;
  profile_name?: string;
}

export const whatsappApi = {
  obtenerQR: (): Promise<ApiResponse<WhatsAppQR>> => client.get('/whatsapp/qr-code'),
  verificarEstado: (): Promise<ApiResponse<WhatsAppStatus>> => client.get('/whatsapp/status'),
  desvincular: (): Promise<ApiResponse<void>> => client.post('/whatsapp/disconnect'),
};

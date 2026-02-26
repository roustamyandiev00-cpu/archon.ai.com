/**
 * Pipedrive API Service
 * Handles all communication with Pipedrive API
 */

const PIPEDRIVE_BASE_URL ='https://api.pipedrive.com/v1';

interface PipedriveConfig {
 apiToken: string;
 companyDomain?: string;
}

class PipedriveService {
 private apiToken: string;
 private baseUrl: string;

 constructor(config: PipedriveConfig) {
 this.apiToken = config.apiToken;
 this.baseUrl = PIPEDRIVE_BASE_URL;
 }

 private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
 const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ?'&':'?'}api_token=${this.apiToken}`;
 
 const response = await fetch(url, {
 ...options,
 headers: {
'Content-Type':'application/json',
 ...options.headers,
 },
 });

 if (!response.ok) {
 const error = await response.json().catch(() => ({ error:'Unknown error'}));
 throw new Error(error.error || `Pipedrive API error: ${response.status}`);
 }

 return response.json();
 }

 // Deals
 async getDeals(params?: { status?: string; limit?: number; start?: number }) {
 const queryParams = new URLSearchParams();
 if (params?.status) queryParams.append('status', params.status);
 if (params?.limit) queryParams.append('limit', params.limit.toString());
 if (params?.start) queryParams.append('start', params.start.toString());
 
 const query = queryParams.toString() ? `?${queryParams.toString()}` :'';
 return this.request<{ data: PipedriveDeal[]; success: boolean }>(`/deals${query}`);
 }

 async getDeal(id: number) {
 return this.request<{ data: PipedriveDeal; success: boolean }>(`/deals/${id}`);
 }

 async createDeal(deal: Partial<PipedriveDeal>) {
 return this.request<{ data: PipedriveDeal; success: boolean }>('/deals', {
 method:'POST',
 body: JSON.stringify(deal),
 });
 }

 async updateDeal(id: number, deal: Partial<PipedriveDeal>) {
 return this.request<{ data: PipedriveDeal; success: boolean }>(`/deals/${id}`, {
 method:'PUT',
 body: JSON.stringify(deal),
 });
 }

 // Persons (Contacts)
 async getPersons(params?: { limit?: number; start?: number }) {
 const queryParams = new URLSearchParams();
 if (params?.limit) queryParams.append('limit', params.limit.toString());
 if (params?.start) queryParams.append('start', params.start.toString());
 
 const query = queryParams.toString() ? `?${queryParams.toString()}` :'';
 return this.request<{ data: PipedrivePerson[]; success: boolean }>(`/persons${query}`);
 }

 async getPerson(id: number) {
 return this.request<{ data: PipedrivePerson; success: boolean }>(`/persons/${id}`);
 }

 // Organizations (Companies)
 async getOrganizations(params?: { limit?: number; start?: number }) {
 const queryParams = new URLSearchParams();
 if (params?.limit) queryParams.append('limit', params.limit.toString());
 if (params?.start) queryParams.append('start', params.start.toString());
 
 const query = queryParams.toString() ? `?${queryParams.toString()}` :'';
 return this.request<{ data: PipedriveOrganization[]; success: boolean }>(`/organizations${query}`);
 }

 // Stages (Pipeline stages)
 async getStages(pipelineId?: number) {
 const query = pipelineId ? `?pipeline_id=${pipelineId}` :'';
 return this.request<{ data: PipedriveStage[]; success: boolean }>(`/stages${query}`);
 }

 // Pipelines
 async getPipelines() {
 return this.request<{ data: PipedrivePipeline[]; success: boolean }>('/pipelines');
 }

 // Activities
 async getActivities(params?: { deal_id?: number; person_id?: number; limit?: number }) {
 const queryParams = new URLSearchParams();
 if (params?.deal_id) queryParams.append('deal_id', params.deal_id.toString());
 if (params?.person_id) queryParams.append('person_id', params.person_id.toString());
 if (params?.limit) queryParams.append('limit', params.limit.toString());
 
 const query = queryParams.toString() ? `?${queryParams.toString()}` :'';
 return this.request<{ data: PipedriveActivity[]; success: boolean }>(`/activities${query}`);
 }

 // Notes
 async getNotes(params?: { deal_id?: number; person_id?: number; limit?: number }) {
 const queryParams = new URLSearchParams();
 if (params?.deal_id) queryParams.append('deal_id', params.deal_id.toString());
 if (params?.person_id) queryParams.append('person_id', params.person_id.toString());
 if (params?.limit) queryParams.append('limit', params.limit.toString());
 
 const query = queryParams.toString() ? `?${queryParams.toString()}` :'';
 return this.request<{ data: PipedriveNote[]; success: boolean }>(`/notes${query}`);
 }
}

// Types
export interface PipedriveDeal {
 id: number;
 title: string;
 value: number;
 currency: string;
 stage_id: number;
 status:'open'|'won'|'lost'|'deleted';
 probability?: number;
 expected_close_date?: string;
 person_id?: number;
 org_id?: number;
 add_time: string;
 update_time: string;
 stage_change_time?: string;
 visible_to: number;
 close_time?: string;
 lost_reason?: string;
 products_count?: number;
 files_count?: number;
 notes_count?: number;
 followers_count?: number;
 email_messages_count?: number;
 activities_count?: number;
 done_activities_count?: number;
 undone_activities_count?: number;
 participants_count?: number;
 stage_order_nr?: number;
}

export interface PipedrivePerson {
 id: number;
 name: string;
 email?: { value: string; primary: boolean }[];
 phone?: { value: string; primary: boolean }[];
 org_id?: number;
 add_time: string;
 update_time: string;
 visible_to: number;
 owner_id?: number;
}

export interface PipedriveOrganization {
 id: number;
 name: string;
 address?: string;
 add_time: string;
 update_time: string;
 visible_to: number;
 owner_id?: number;
 people_count?: number;
 deals_count?: number;
}

export interface PipedriveStage {
 id: number;
 name: string;
 pipeline_id: number;
 order_nr: number;
 deal_probability: number;
 active_flag: boolean;
}

export interface PipedrivePipeline {
 id: number;
 name: string;
 url_title: string;
 order_nr: number;
 active: boolean;
 add_time: string;
 update_time: string;
}

export interface PipedriveActivity {
 id: number;
 type: string;
 subject: string;
 done: boolean;
 due_date?: string;
 due_time?: string;
 deal_id?: number;
 person_id?: number;
 org_id?: number;
 add_time: string;
 update_time: string;
}

export interface PipedriveNote {
 id: number;
 content: string;
 deal_id?: number;
 person_id?: number;
 org_id?: number;
 add_time: string;
 update_time: string;
}

export { PipedriveService };
export default PipedriveService;

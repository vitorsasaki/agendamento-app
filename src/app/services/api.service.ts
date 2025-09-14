import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('🌍 Ambiente atual:', environment.production ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
    console.log('🔗 API URL:', this.apiUrl);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  get<T>(endpoint: string): Promise<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders()
    }).toPromise() as Promise<T>;
  }

  post<T>(endpoint: string, data: any): Promise<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).toPromise() as Promise<T>;
  }

  put<T>(endpoint: string, data: any): Promise<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).toPromise() as Promise<T>;
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders()
    }).toPromise() as Promise<T>;
  }
}
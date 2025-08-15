import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  user: any = null;
  currentDate = new Date();
  
  // Dados de exemplo para o dashboard
  stats = {
    totalAgendamentos: 24,
    agendamentosHoje: 5,
    agendamentosPendentes: 3,
    agendamentosConcluidos: 16
  };
  
  recentAgendamentos = [
    {
      id: 1,
      cliente: 'João Silva',
      servico: 'Corte de Cabelo',
      data: '2024-01-15',
      hora: '14:00',
      status: 'confirmado'
    },
    {
      id: 2,
      cliente: 'Maria Santos',
      servico: 'Manicure',
      data: '2024-01-15',
      hora: '15:30',
      status: 'pendente'
    },
    {
      id: 3,
      cliente: 'Pedro Costa',
      servico: 'Barba',
      data: '2024-01-15',
      hora: '16:00',
      status: 'confirmado'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
    this.checkAuthentication();
  }

  loadUserData(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
    }
  }

  checkAuthentication(): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmado':
        return 'status-confirmed';
      case 'pendente':
        return 'status-pending';
      case 'cancelado':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'confirmado':
        return 'Confirmado';
      case 'pendente':
        return 'Pendente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatCurrentDate(): string {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };
    
    return date.toLocaleDateString('pt-BR', options);
  }

  // Navegar para páginas
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
} 
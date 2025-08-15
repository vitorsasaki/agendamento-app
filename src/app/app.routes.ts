import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ProfissionaisComponent } from './components/profissionais/profissionais';
import { PacientesComponent } from './components/pacientes/pacientes';
import { AgendamentosComponent } from './components/agendamentos/agendamentos';
import { LayoutComponent } from './components/layout/layout';

// Guarda de autenticação simples
const authGuard = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'profissionais',
        component: ProfissionaisComponent
      },
      {
        path: 'pacientes',
        component: PacientesComponent
      },
      {
        path: 'agendamentos',
        component: AgendamentosComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];

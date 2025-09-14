import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface LoginData {
  email: string;
  senha: string;
}

interface LoginResponse {
  token?: string;
  message?: string;
  tipo?: string;
  nomeUsuario?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  // Dados do formulário
  loginData: LoginData = {
    email: '',
    senha: ''
  };
  
  // Estados da interface
  isLoading = false;
  showPassword = false;
  
  // Mensagens de erro
  emailError = '';
  passwordError = '';
  loginError = '';
  
  constructor(private apiService: ApiService, private router: Router) {}
  
  // Validação de email
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // Validação de senha
  validatePassword(password: string): boolean {
    return password.length >= 6;
  }
  
  // Limpar erros
  clearErrors(): void {
    this.emailError = '';
    this.passwordError = '';
    this.loginError = '';
  }
  
  // Validar formulário
  validateForm(): boolean {
    this.clearErrors();
    let isValid = true;
    
    // Validar email
    if (!this.loginData.email) {
      this.emailError = 'E-mail é obrigatório';
      isValid = false;
    } else if (!this.validateEmail(this.loginData.email)) {
      this.emailError = 'E-mail inválido';
      isValid = false;
    }
    
    // Validar senha
    if (!this.loginData.senha) {
      this.passwordError = 'Senha é obrigatória';
      isValid = false;
    } else if (!this.validatePassword(this.loginData.senha)) {
      this.passwordError = 'Senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }
    
    return isValid;
  }
  
  // Alternar visibilidade da senha
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
  
  // Função de login
  async onLogin(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }
    
    this.isLoading = true;
    this.clearErrors();
    
    try {
      const response = await this.apiService.post<LoginResponse>('/auth/login', this.loginData);
      
      if (response?.token) {
        // Login bem-sucedido
        localStorage.setItem('authToken', response.token);
        
        // Salvar dados do usuário
        const userData = {
          nomeUsuario: response.nomeUsuario,
          tipo: response.tipo
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirecionar para o dashboard
        this.router.navigate(['/dashboard']);
        
        // Limpar formulário
        this.loginData = { email: '', senha: '' };
      } else {
        this.loginError = response?.message || 'Erro no login. Tente novamente.';
      }
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      if (error.status === 401) {
        this.loginError = 'E-mail ou senha incorretos';
      } else if (error.status === 0) {
        this.loginError = 'Erro de conexão. Verifique se o servidor está rodando.';
      } else if (error.status >= 500) {
        this.loginError = 'Erro no servidor. Tente novamente mais tarde.';
      } else {
        this.loginError = 'Erro inesperado. Tente novamente.';
      }
    } finally {
      this.isLoading = false;
    }
  }
  
  // Função para "esqueci minha senha"
  forgotPassword(event: Event): void {
    event.preventDefault();
    alert('Funcionalidade de recuperação de senha será implementada em breve!');
  }
}
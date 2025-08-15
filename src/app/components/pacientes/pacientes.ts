import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Paciente {
  id?: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class PacientesComponent implements OnInit {
  pacientes: Paciente[] = [];
  pacienteSelecionado: Paciente | null = null;
  mostrarModal = false;
  isLoading = false;
  isSearching = false;
  erro = '';
  searchTerm = '';
  searchTimeout: any;
  
  // Controles de paginação
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;
  pageNumbers: number[] = [];
  
  // Dados do formulário
  formData: Paciente = {
    nome: '',
    cpf: '',
    email: '',
    telefone: ''
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.carregarPacientes();
  }

  // Carregar lista de pacientes
  async carregarPacientes(page: number = 0): Promise<void> {
    this.isLoading = true;
    this.erro = '';

    try {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const params = new URLSearchParams({
        page: page.toString(),
        size: this.pageSize.toString(),
        sort: 'nome,asc'
      });

      const response = await this.http.get<PageResponse<Paciente>>(
        `http://localhost:8080/api/pacientes?${params.toString()}`,
        { headers }
      ).toPromise();

      if (response) {
        // Extrair dados de paginação
        this.pacientes = response.content || [];
        this.currentPage = response.number;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.generatePageNumbers();
      }
    } catch (error: any) {
      console.error('Erro ao carregar pacientes:', error);
      this.erro = 'Erro ao carregar pacientes. Tente novamente.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Gerar números das páginas para navegação
  generatePageNumbers(): void {
    this.pageNumbers = [];
    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      this.pageNumbers.push(i);
    }
  }

  // Ir para página específica
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.carregarPacientes(page);
    }
  }

  // Ir para página anterior
  previousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  // Ir para próxima página
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  // Ir para primeira página
  firstPage(): void {
    if (this.currentPage !== 0) {
      this.goToPage(0);
    }
  }

  // Ir para última página
  lastPage(): void {
    if (this.currentPage !== this.totalPages - 1) {
      this.goToPage(this.totalPages - 1);
    }
  }

  // Alterar tamanho da página
  changePageSize(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 0; // Resetar para primeira página
    this.carregarPacientes(0);
  }

  // Manipular mudança do seletor de tamanho da página
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.changePageSize(Number(target.value));
    }
  }

  // Calcular índice final para exibição
  getEndIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  // Buscar pacientes por nome
  async buscarPacientes(nome: string): Promise<void> {
    this.isSearching = true;
    this.erro = '';

    try {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const response = await this.http.get<PageResponse<Paciente>>(
        `http://localhost:8080/api/pacientes/search?nome=${encodeURIComponent(nome)}`,
        { headers }
      ).toPromise();

      this.pacientes = response?.content || [];
    } catch (error: any) {
      console.error('Erro ao buscar pacientes:', error);
      this.erro = 'Erro ao buscar pacientes. Tente novamente.';
    } finally {
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  // Método chamado quando o usuário digita no campo de busca
  onSearchInput(event: any): void {
    const searchValue = event.target.value.trim();
    this.searchTerm = searchValue;

    // Limpar timeout anterior
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce de 500ms para evitar muitas requisições
    this.searchTimeout = setTimeout(() => {
      if (searchValue.length >= 2) {
        // Buscar apenas se tiver pelo menos 2 caracteres
        this.buscarPacientes(searchValue);
      } else if (searchValue.length === 0) {
        // Se campo estiver vazio, carregar todos os pacientes
        this.carregarPacientes();
      }
    }, 500);
  }

  // Limpar busca
  limparBusca(): void {
    this.searchTerm = '';
    this.currentPage = 0; // Resetar para primeira página
    this.carregarPacientes(0);
  }

  // Abrir modal para novo paciente
  novoPaciente(): void {
    this.pacienteSelecionado = null;
    this.formData = {
      nome: '',
      cpf: '',
      email: '',
      telefone: ''
    };
    this.mostrarModal = true;
  }

  // Abrir modal para editar paciente
  editarPaciente(paciente: Paciente): void {
    this.pacienteSelecionado = paciente;
    this.formData = { ...paciente };
    this.mostrarModal = true;
  }

  // Fechar modal
  fecharModal(): void {
    this.mostrarModal = false;
    this.pacienteSelecionado = null;
    this.erro = '';
  }

  // Salvar paciente (criar ou atualizar)
  async salvarPaciente(): Promise<void> {
    if (!this.validarFormulario()) {
      return;
    }

    this.isLoading = true;
    this.erro = '';

    try {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      // Limpar formatação antes de enviar
      const dadosParaEnvio = {
        ...this.formData,
        cpf: this.limparFormatacao(this.formData.cpf),
        telefone: this.limparFormatacao(this.formData.telefone)
      };

      if (this.pacienteSelecionado?.id) {
        // Atualizar
        await this.http.put(
          `http://localhost:8080/api/pacientes/${this.pacienteSelecionado.id}`,
          dadosParaEnvio,
          { headers }
        ).toPromise();
      } else {
        // Criar
        await this.http.post(
          'http://localhost:8080/api/pacientes',
          dadosParaEnvio,
          { headers }
        ).toPromise();
      }

      this.fecharModal();
      this.carregarPacientes();
    } catch (error: any) {
      
      // Extrair mensagem de erro do backend - versão expandida
      let mensagemErro = 'Erro ao salvar paciente. Tente novamente.';
      
      if (error.error) {
        if (typeof error.error === 'string') {
          // Se error.error é uma string
          mensagemErro = error.error;
        } else if (error.error.error) {
          // Se tem campo error dentro de error
          mensagemErro = error.error.error;
        } else if (error.error.message) {
          // Se tem campo message dentro de error
          mensagemErro = error.error.message;
        } else if (error.error.errors && Array.isArray(error.error.errors)) {
          // Se tem array de erros
          mensagemErro = error.error.errors.join(', ');
        }
      }
      
      this.erro = mensagemErro;
      
      // Forçar detecção de mudanças para garantir que a mensagem apareça
      this.cdr.detectChanges();
      
    } finally {
      this.isLoading = false;
      console.log('13. Finally executado - isLoading definido como false');
    }
  }

  // Excluir paciente
  async excluirPaciente(id: number): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) {
      return;
    }

    this.isLoading = true;
    this.erro = '';

    try {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      await this.http.delete(
        `http://localhost:8080/api/pacientes/${id}`,
        { headers }
      ).toPromise();

      this.carregarPacientes();
    } catch (error: any) {
      console.error('Erro ao excluir paciente:', error);
      
      // Extrair mensagem de erro do backend
      if (error.error && error.error.error) {
        this.erro = error.error.error;
      } else if (error.error && error.error.message) {
        this.erro = error.error.message;
      } else if (error.status === 404) {
        this.erro = 'Paciente não encontrado.';
      } else if (error.status === 409) {
        this.erro = 'Não é possível excluir este paciente pois ele possui agendamentos.';
      } else if (error.status === 500) {
        this.erro = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else {
        this.erro = 'Erro ao excluir paciente. Tente novamente.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Validar formulário
  validarFormulario(): boolean {
    if (!this.formData.nome?.trim()) {
      this.erro = 'Nome é obrigatório';
      return false;
    }
    if (!this.formData.cpf?.trim()) {
      this.erro = 'CPF é obrigatório';
      return false;
    }
    if (!this.validarCPF(this.limparFormatacao(this.formData.cpf))) {
      this.erro = 'CPF inválido';
      return false;
    }
    if (!this.formData.email?.trim()) {
      this.erro = 'E-mail é obrigatório';
      return false;
    }
    if (!this.validarEmail(this.formData.email)) {
      this.erro = 'E-mail inválido';
      return false;
    }
    if (!this.formData.telefone?.trim()) {
      this.erro = 'Telefone é obrigatório';
      return false;
    }
    return true;
  }

  // Validar email
  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar CPF
  validarCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]+/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }

  // Formatar CPF
  formatarCPF(cpf: string): string {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cpf;
  }

  // Formatar telefone
  formatarTelefone(telefone: string): string {
    if (!telefone) return '';
    const cleaned = telefone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `(${match[1]})${match[2]}-${match[3]}`;
    }
    return telefone;
  }

  // Limpar formatação
  limparFormatacao(valor: string): string {
    return valor ? valor.replace(/\D/g, '') : '';
  }

  // Aplicar máscara de CPF no input
  onCPFInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      this.formData.cpf = this.formatarCPF(value);
    }
  }

  // Aplicar máscara de telefone no input
  onTelefoneInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      this.formData.telefone = this.formatarTelefone(value);
    }
  }
}
import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Especialidade {
  id: number;
  nomeEspecialidade: string;
  descricao?: string;
}

interface Profissional {
  id?: number;
  nomeProfissional: string;
  crm: string;
  idCliente?: number;
  idEspecialidade: number;
  especialidade?: string; // Para exibição na listagem
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
  selector: 'app-profissionais',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profissionais.html',
  styleUrl: './profissionais.css'
})
export class ProfissionaisComponent implements OnInit {
  profissionais: Profissional[] = [];
  especialidades: Especialidade[] = [];
  profissionalSelecionado: Profissional | null = null;
  mostrarModal = false;
  isLoading = false;
  isLoadingEspecialidades = false;
  erro = '';
  
  // Dados do formulário
  formData: Profissional = {
    nomeProfissional: '',
    idEspecialidade: 0,
    crm: ''
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.carregarProfissionais();
    this.carregarEspecialidades();
  }

  // Carregar lista de profissionais
  async carregarProfissionais(): Promise<void> {
    this.isLoading = true;
    this.erro = '';

    try {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const response = await this.http.get<PageResponse<Profissional>>(
        'http://localhost:8080/api/profissionais',
        { headers }
      ).toPromise();

      // Extrair o array de profissionais do objeto Page
      this.profissionais = response?.content || [];
    } catch (error: any) {
      console.error('Erro ao carregar profissionais:', error);
      this.erro = 'Erro ao carregar profissionais. Tente novamente.';
    } finally {
      this.isLoading = false;
      console.log('Finally - isLoading definido como false');
      // Forçar detecção de mudanças
      this.cdr.detectChanges();
    }
  }

  // Carregar lista de especialidades
  async carregarEspecialidades(): Promise<void> {
    this.isLoadingEspecialidades = true;
    console.log('Iniciando carregamento de especialidades...');

    try {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      console.log('Fazendo chamada para: http://localhost:8080/api/especialidade');
      const response = await this.http.get<PageResponse<Especialidade>>(
        'http://localhost:8080/api/especialidade',
        { headers }
      ).toPromise();

      // Usar NgZone para garantir que o Angular detecte as mudanças
      this.ngZone.run(() => {
        this.especialidades = response?.content || [];
        console.log('Especialidades carregadas:', this.especialidades);
        console.log('Primeira especialidade:', this.especialidades[0]);
        this.cdr.markForCheck();
      });
      
    } catch (error: any) {
      console.error('Erro ao carregar especialidades:', error);
      console.error('Status do erro:', error.status);
      console.error('URL da requisição:', error.url);
      // Não mostrar erro para o usuário se as especialidades não carregarem
      // Apenas mostrar um console.error para debug
    } finally {
      this.isLoadingEspecialidades = false;
      this.cdr.detectChanges();
    }
  }

  // Abrir modal para novo profissional
  novoProfissional(): void {
    this.profissionalSelecionado = null;
    this.formData = {
      nomeProfissional: '',
      idEspecialidade: 0,
      crm: ''
    };
    
    // Garantir que as especialidades estejam carregadas
    if (this.especialidades.length === 0 && !this.isLoadingEspecialidades) {
      console.log('Recarregando especialidades no modal...');
      this.carregarEspecialidades();
    }
    
    this.mostrarModal = true;
  }

  // Abrir modal para editar profissional
  editarProfissional(profissional: Profissional): void {
    this.profissionalSelecionado = profissional;
    this.formData = { ...profissional };
    this.mostrarModal = true;
  }

  // Fechar modal
  fecharModal(): void {
    this.mostrarModal = false;
    this.profissionalSelecionado = null;
    this.erro = '';
  }

  // Salvar profissional (criar ou atualizar)
  async salvarProfissional(): Promise<void> {
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

      if (this.profissionalSelecionado?.id) {
        // Atualizar
        await this.http.put(
          `http://localhost:8080/api/profissionais/${this.profissionalSelecionado.id}`,
          this.formData,
          { headers }
        ).toPromise();
      } else {
        // Criar
        await this.http.post(
          'http://localhost:8080/api/profissionais',
          this.formData,
          { headers }
        ).toPromise();
      }

      this.fecharModal();
      this.carregarProfissionais();
    } catch (error: any) {
      console.error('Erro ao salvar profissional:', error);
      console.error('Estrutura completa do erro:', {
        status: error.status,
        error: error.error,
        message: error.message
      });
      
      // Extrair mensagem de erro do backend
      if (error.error && error.error.error) {
        this.erro = error.error.error;
      } else if (error.error && error.error.message) {
        this.erro = error.error.message;
      } else if (error.status === 400) {
        this.erro = 'Dados inválidos. Verifique as informações e tente novamente.';
      } else if (error.status === 409) {
        this.erro = 'Conflito de dados. Verifique se as informações já não existem no sistema.';
      } else if (error.status === 500) {
        this.erro = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else {
        this.erro = 'Erro ao salvar profissional. Tente novamente.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Excluir profissional
  async excluirProfissional(id: number): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) {
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
        `http://localhost:8080/api/profissionais/${id}`,
        { headers }
      ).toPromise();

      this.carregarProfissionais();
    } catch (error: any) {
      console.error('Erro ao excluir profissional:', error);
      this.erro = 'Erro ao excluir profissional. Tente novamente.';
    } finally {
      this.isLoading = false;
    }
  }



  // Validar formulário
  validarFormulario(): boolean {
    if (!this.formData.nomeProfissional?.trim()) {
      this.erro = 'Nome do profissional é obrigatório';
      return false;
    }
    if (!this.formData.idEspecialidade || this.formData.idEspecialidade === 0) {
      this.erro = 'Especialidade é obrigatória';
      return false;
    }
    if (!this.formData.crm?.trim()) {
      this.erro = 'CRM é obrigatório';
      return false;
    }
    return true;
  }

  // Obter nome da especialidade pelo ID
  getNomeEspecialidade(idEspecialidade: number): string {
    const especialidade = this.especialidades.find(e => e.id === idEspecialidade);
    return especialidade?.nomeEspecialidade || 'Não informado';
  }

}
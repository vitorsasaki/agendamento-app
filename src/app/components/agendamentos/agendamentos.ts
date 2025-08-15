import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Agendamento {
  id?: number;
  dataHora: string;
  nomePaciente: string;
  nomeProfissional: string;
  idPaciente?: number;
  idProfissional?: number;
  observacao: string;
  status: string;
}

interface Paciente {
  id?: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
}

interface Profissional {
  id?: number;
  nomeProfissional: string;
  crm: string;
  idCliente?: number;
  idEspecialidade: number;
  especialidade?: string;
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
  selector: 'app-agendamentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agendamentos.html',
  styleUrl: './agendamentos.css'
})
export class AgendamentosComponent implements OnInit {
  agendamentos: Agendamento[] = []; // Para lista paginada
  todosAgendamentos: Agendamento[] = []; // Para calendário (todos os registros)
  agendamentoSelecionado: Agendamento | null = null;
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
  pageSize = 5;
  pageNumbers: number[] = [];
  
  // Busca de pacientes
  pacientes: Paciente[] = [];
  pacienteSelecionado: Paciente | null = null;
  isSearchingPacientes = false;
  pacienteSearchTerm = '';
  pacienteSearchTimeout: any;
  mostrarListaPacientes = false;
  
  // Busca de profissionais
  profissionais: Profissional[] = [];
  profissionalSelecionado: Profissional | null = null;
  isSearchingProfissionais = false;
  profissionalSearchTerm = '';
  profissionalSearchTimeout: any;
  mostrarListaProfissionais = false;
  
  // Sistema de abas
  activeTab: 'lista' | 'calendario' = 'lista';
  
  // Visualização do calendário
  calendarView: 'month' | 'week' = 'month';
  
  // Calendário
  currentDate = new Date();
  calendarDays: any[] = [];
  weekDays: any[] = [];
  timeSlots: string[] = [];
  monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  dayNamesShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  
  // Opções de status
  statusOptions = [
    { value: 'AGENDADO', label: 'Agendado', color: '#3b82f6' },
    { value: 'CONFIRMADO', label: 'Confirmado', color: '#059669' },
    { value: 'EM_ANDAMENTO', label: 'Em Andamento', color: '#f59e0b' },
    { value: 'CONCLUIDO', label: 'Concluído', color: '#10b981' },
    { value: 'CANCELADO', label: 'Cancelado', color: '#ef4444' },
    { value: 'AUSENTE', label: 'Paciente Ausente', color: '#9ca3af' }
  ];
  
  // Dados do formulário
  formData: Agendamento = {
    dataHora: '',
    nomePaciente: '',
    nomeProfissional: '',
    observacao: '',
    status: 'AGENDADO'
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.generateTimeSlots();
    this.atualizarTodosDados(); // Carrega tudo de uma vez
  }

  // Carregar lista de agendamentos
  async carregarAgendamentos(page: number = 0): Promise<void> {
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
        sort: 'dataHora,desc'
      });

      const response = await this.http.get<PageResponse<Agendamento>>(
        `http://localhost:8080/api/agendamentos?${params.toString()}`,
        { headers }
      ).toPromise();

      if (response) {
        // Extrair dados de paginação
        this.agendamentos = response.content || [];
        this.currentPage = response.number;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        
        this.generatePageNumbers();
      }
      
      // Atualizar calendário após carregar agendamentos
      this.generateCalendar();
      this.generateWeekView();
    } catch (error: any) {
      console.error('Erro ao carregar agendamentos:', error);
      this.erro = 'Erro ao carregar agendamentos. Tente novamente.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Carregar todos os agendamentos para o calendário
  async carregarTodosAgendamentos(): Promise<void> {
    try {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      // Carregar todos os agendamentos sem paginação para o calendário
      const response = await this.http.get<PageResponse<Agendamento>>(
        'http://localhost:8080/api/agendamentos?page=0&size=1000&sort=dataHora,desc',
        { headers }
      ).toPromise();

      if (response) {
        this.todosAgendamentos = response.content || [];
      }
    } catch (error: any) {
      console.error('Erro ao carregar todos os agendamentos:', error);
      // Não exibir erro para o usuário, pois é só para o calendário
    }
  }

  // Atualizar todos os dados (lista + calendário)
  async atualizarTodosDados(): Promise<void> {
    await Promise.all([
      this.carregarAgendamentos(this.currentPage),
      this.carregarTodosAgendamentos()
    ]);
    
    // Regenerar calendário com novos dados
    this.generateCalendar();
    this.generateWeekView();
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
      this.carregarAgendamentos(page);
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
    this.carregarAgendamentos(0);
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

  // Buscar agendamentos por paciente
  async buscarAgendamentos(termo: string): Promise<void> {
    this.isSearching = true;
    this.erro = '';

    try {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const response = await this.http.get<PageResponse<Agendamento>>(
        `http://localhost:8080/api/agendamentos/search?paciente=${encodeURIComponent(termo)}`,
        { headers }
      ).toPromise();

      this.agendamentos = response?.content || [];
      // Atualizar calendário após buscar agendamentos
      this.generateCalendar();
      this.generateWeekView();
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos:', error);
      this.erro = 'Erro ao buscar agendamentos. Tente novamente.';
    } finally {
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  // Método chamado quando o usuário digita no campo de busca
  onSearchInput(event: any): void {
    const searchValue = event.target.value.trim();
    this.searchTerm = searchValue;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      if (searchValue.length >= 2) {
        this.buscarAgendamentos(searchValue);
      } else if (searchValue.length === 0) {
        this.atualizarTodosDados();
      }
    }, 500);
  }

  // Limpar busca
  limparBusca(): void {
    this.searchTerm = '';
    this.currentPage = 0; // Resetar para primeira página
    this.atualizarTodosDados();
  }

  // Buscar pacientes no endpoint
  async buscarPacientes(termo: string): Promise<void> {
    this.isSearchingPacientes = true;
    this.cdr.detectChanges();
    
    
    try {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const response = await this.http.get<PageResponse<Paciente>>(
        `http://localhost:8080/api/pacientes/search?nome=${encodeURIComponent(termo)}`,
        { headers }
      ).toPromise();

      this.pacientes = response?.content || [];
      this.mostrarListaPacientes = this.pacientes.length > 0;
      
      
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      this.pacientes = [];
      this.mostrarListaPacientes = false;
    } finally {
      this.isSearchingPacientes = false;
      this.cdr.detectChanges();
    }
  }

  // Manipular input de busca de pacientes
  onPacienteSearchInput(event: any): void {
    const searchValue = event.target.value;
    this.processPacienteSearch(searchValue);
  }

  // Manipular mudança no ngModel
  onPacienteSearchChange(value: string): void {
    this.processPacienteSearch(value);
  }

  // Processar busca de pacientes (método unificado)
  private processPacienteSearch(searchValue: string): void {
    this.pacienteSearchTerm = searchValue;    

    // Limpar timeout anterior
    if (this.pacienteSearchTimeout) {
      clearTimeout(this.pacienteSearchTimeout);
    }

    // Se o campo estiver vazio, esconder a lista
    if (searchValue.length === 0) {
      this.pacientes = [];
      this.mostrarListaPacientes = false;
      this.pacienteSelecionado = null;
      this.cdr.detectChanges();
      return;
    }

    // Buscar somente se tiver 3 ou mais caracteres
    if (searchValue.length >= 3) {      
      this.pacienteSearchTimeout = setTimeout(() => {
        this.buscarPacientes(searchValue);
      }, 300);
    } else {
      this.pacientes = [];
      this.mostrarListaPacientes = false;
      this.cdr.detectChanges();
    }
  }

  // Selecionar paciente da lista
  selecionarPaciente(paciente: Paciente): void {
    this.pacienteSelecionado = paciente;
    this.formData.nomePaciente = paciente.nome;
    this.formData.idPaciente = paciente.id;
    this.pacienteSearchTerm = paciente.nome;
    this.mostrarListaPacientes = false;
    this.pacientes = [];
  }

  // Limpar seleção de paciente
  limparPaciente(): void {
    this.pacienteSelecionado = null;
    this.pacienteSearchTerm = '';
    this.formData.nomePaciente = '';
    this.formData.idPaciente = undefined;
    this.pacientes = [];
    this.mostrarListaPacientes = false;
  }

  // Buscar profissionais no endpoint
  async buscarProfissionais(termo: string): Promise<void> {
    this.isSearchingProfissionais = true;
    this.cdr.detectChanges();        
    
    try {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const response = await this.http.get<PageResponse<Profissional>>(
        `http://localhost:8080/api/profissionais/search?nome=${encodeURIComponent(termo)}`,
        { headers }
      ).toPromise();

      this.profissionais = response?.content || [];
      this.mostrarListaProfissionais = this.profissionais.length > 0;      
      
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      this.profissionais = [];
      this.mostrarListaProfissionais = false;
    } finally {
      this.isSearchingProfissionais = false;
      this.cdr.detectChanges();
    }
  }

  // Manipular input de busca de profissionais
  onProfissionalSearchInput(event: any): void {
    const searchValue = event.target.value;
    this.processProfissionalSearch(searchValue);
  }

  // Manipular mudança no ngModel de profissionais
  onProfissionalSearchChange(value: string): void {
    this.processProfissionalSearch(value);
  }

  // Processar busca de profissionais (método unificado)
  private processProfissionalSearch(searchValue: string): void {
    this.profissionalSearchTerm = searchValue;        

    // Limpar timeout anterior
    if (this.profissionalSearchTimeout) {
      clearTimeout(this.profissionalSearchTimeout);
    }

    // Se o campo estiver vazio, esconder a lista
    if (searchValue.length === 0) {
      this.profissionais = [];
      this.mostrarListaProfissionais = false;
      this.profissionalSelecionado = null;
      this.cdr.detectChanges();
      return;
    }

    // Buscar somente se tiver 3 ou mais caracteres
    if (searchValue.length >= 3) {      
      this.profissionalSearchTimeout = setTimeout(() => {
        this.buscarProfissionais(searchValue);
      }, 300);
    } else {
      this.profissionais = [];
      this.mostrarListaProfissionais = false;
      this.cdr.detectChanges();
    }
  }

  // Selecionar profissional da lista
  selecionarProfissional(profissional: Profissional): void {
    this.profissionalSelecionado = profissional;
    this.formData.nomeProfissional = profissional.nomeProfissional;
    this.formData.idProfissional = profissional.id;
    this.profissionalSearchTerm = profissional.nomeProfissional;
    this.mostrarListaProfissionais = false;
    this.profissionais = [];
  }

  // Limpar seleção de profissional
  limparProfissional(): void {
    this.profissionalSelecionado = null;
    this.profissionalSearchTerm = '';
    this.formData.nomeProfissional = '';
    this.formData.idProfissional = undefined;
    this.profissionais = [];
    this.mostrarListaProfissionais = false;
  }

  // Abrir modal para novo agendamento
  novoAgendamento(): void {
    this.agendamentoSelecionado = null;
    this.formData = {
      dataHora: '',
      nomePaciente: '',
      nomeProfissional: '',
      observacao: '',
      status: 'AGENDADO'
    };
    // Limpar dados de busca de pacientes e profissionais
    this.limparPaciente();
    this.limparProfissional();
    this.mostrarModal = true;
  }

  // Abrir modal para editar agendamento
  editarAgendamento(agendamento: Agendamento): void {
    this.agendamentoSelecionado = agendamento;
    this.formData = { ...agendamento };
    // Formatar data para input datetime-local
    if (this.formData.dataHora) {
      this.formData.dataHora = this.formatarDataParaInput(this.formData.dataHora);
    }
    this.mostrarModal = true;
  }

  // Fechar modal
  fecharModal(): void {
    this.mostrarModal = false;
    this.agendamentoSelecionado = null;
    this.erro = '';
    // Limpar dados de busca de pacientes e profissionais
    this.limparPaciente();
    this.limparProfissional();
  }

  // Salvar agendamento (criar ou atualizar)
  async salvarAgendamento(): Promise<void> {
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

      // Formatar data para o backend
      const dadosParaEnvio = {
        ...this.formData,
        dataHora: this.formatarDataParaBackend(this.formData.dataHora)
      };            

      if (this.agendamentoSelecionado?.id) {
        // Atualizar
        await this.http.put(
          `http://localhost:8080/api/agendamentos/${this.agendamentoSelecionado.id}`,
          dadosParaEnvio,
          { headers }
        ).toPromise();
      } else {
        // Criar
        await this.http.post(
          'http://localhost:8080/api/agendamentos',
          dadosParaEnvio,
          { headers }
        ).toPromise();
      }

      this.fecharModal();
      this.atualizarTodosDados();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      
      // Extrair mensagem de erro do backend
      if (error.error && error.error.error) {
        this.erro = error.error.error;
      } else if (error.error && error.error.message) {
        this.erro = error.error.message;
      } else if (error.status === 400) {
        this.erro = 'Dados inválidos. Verifique as informações e tente novamente.';
      } else if (error.status === 409) {
        this.erro = 'Conflito de horário. Já existe um agendamento neste horário.';
      } else if (error.status === 500) {
        this.erro = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else {
        this.erro = 'Erro ao salvar agendamento. Tente novamente.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Excluir agendamento
  async excluirAgendamento(id: number): Promise<void> {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
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
        `http://localhost:8080/api/agendamentos/${id}`,
        { headers }
      ).toPromise();

      this.atualizarTodosDados();
    } catch (error: any) {
      console.error('Erro ao excluir agendamento:', error);
      
      if (error.error && error.error.error) {
        this.erro = error.error.error;
      } else if (error.error && error.error.message) {
        this.erro = error.error.message;
      } else if (error.status === 404) {
        this.erro = 'Agendamento não encontrado.';
      } else if (error.status === 409) {
        this.erro = 'Não é possível excluir este agendamento.';
      } else {
        this.erro = 'Erro ao excluir agendamento. Tente novamente.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Validar formulário
  validarFormulario(): boolean {
    if (!this.formData.dataHora?.trim()) {
      this.erro = 'Data e hora são obrigatórios';
      return false;
    }
    if (!this.formData.nomePaciente?.trim()) {
      this.erro = 'Nome do paciente é obrigatório';
      return false;
    }
    if (!this.formData.idPaciente) {
      this.erro = 'Selecione um paciente da lista';
      return false;
    }
    if (!this.formData.nomeProfissional?.trim()) {
      this.erro = 'Nome do profissional é obrigatório';
      return false;
    }
    if (!this.formData.idProfissional) {
      this.erro = 'Selecione um profissional da lista';
      return false;
    }
    if (!this.formData.status?.trim()) {
      this.erro = 'Status é obrigatório';
      return false;
    }
    
    // Validar se a data não é no passado (apenas para novos agendamentos)
    if (!this.agendamentoSelecionado) {
      const dataAgendamento = new Date(this.formData.dataHora);
      const agora = new Date();
      if (dataAgendamento < agora) {
        this.erro = 'A data e hora do agendamento não pode ser no passado';
        return false;
      }
    }
    
    return true;
  }

  // Formatar data para exibição
  formatarDataHora(dataHora: string): string {
    if (!dataHora) return 'Data não informada';
    try {
      const data = new Date(dataHora);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  }

  // Formatar data para input datetime-local
  formatarDataParaInput(dataHora: string): string {
    if (!dataHora) return '';
    try {
      const data = new Date(dataHora);
      const year = data.getFullYear();
      const month = String(data.getMonth() + 1).padStart(2, '0');
      const day = String(data.getDate()).padStart(2, '0');
      const hours = String(data.getHours()).padStart(2, '0');
      const minutes = String(data.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  // Formatar data para envio ao backend
  formatarDataParaBackend(dataHora: string): string {
    if (!dataHora) return '';
    try {
      const data = new Date(dataHora);
      return data.toISOString();
    } catch {
      return '';
    }
  }

  // Obter cor do status
  getStatusColor(status: string): string {
    const statusOption = this.statusOptions.find(s => s.value === status);
    return statusOption?.color || '#9ca3af';
  }

  // Obter label do status
  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(s => s.value === status);
    return statusOption?.label || status;
  }

  // Alternar entre abas
  setActiveTab(tab: 'lista' | 'calendario'): void {
    this.activeTab = tab;
  }

  // Alternar visualização do calendário
  setCalendarView(view: 'month' | 'week'): void {
    this.calendarView = view;
    if (view === 'week') {
      this.generateWeekView();
    } else {
      this.generateCalendar();
    }
  }

  // Gerar calendário
  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Começar no domingo da semana que contém o primeiro dia
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Terminar no sábado da semana que contém o último dia
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayInfo = {
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isToday(currentDate),
        agendamentos: this.getAgendamentosForDate(currentDate)
      };
      
      this.calendarDays.push(dayInfo);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Verificar se é hoje
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Obter agendamentos para uma data específica
  getAgendamentosForDate(date: Date): Agendamento[] {
    return this.todosAgendamentos.filter(agendamento => {
      if (!agendamento.dataHora) return false;
      const agendamentoDate = new Date(agendamento.dataHora);
      return agendamentoDate.toDateString() === date.toDateString();
    });
  }

  // Navegar para mês anterior
  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendar();
  }

  // Navegar para próximo mês
  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendar();
  }

  // Ir para mês atual
  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendar();
  }

  // Obter nome do mês atual
  getCurrentMonthName(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  // Clique em um dia do calendário
  onDayClick(dayInfo: any): void {
    if (dayInfo.agendamentos.length > 0) {
      // Se há agendamentos, pode mostrar detalhes ou abrir modal      
    } else if (dayInfo.isCurrentMonth) {
      // Se não há agendamentos e é do mês atual, pode criar novo agendamento
      this.novoAgendamentoParaData(dayInfo.date);
    }
  }

  // Criar novo agendamento para data específica
  novoAgendamentoParaData(date: Date): void {
    this.agendamentoSelecionado = null;
    
    // Definir data para 9:00 da manhã
    const dataHora = new Date(date);
    dataHora.setHours(9, 0, 0, 0);
    
    this.formData = {
      dataHora: this.formatarDataParaInput(dataHora.toISOString()),
      nomePaciente: '',
      nomeProfissional: '',
      observacao: '',
      status: 'AGENDADO'
    };
    this.mostrarModal = true;
  }

  // Atualizar calendário após carregar agendamentos
  atualizarCalendario(): void {
    this.generateCalendar();
  }

  // Gerar slots de horário (7h às 19h)
  generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = 7; hour <= 19; hour++) {
      this.timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
  }

  // Gerar visualização semanal
  generateWeekView(): void {
    const startOfWeek = this.getStartOfWeek(this.currentDate);
    this.weekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayInfo = {
        date: new Date(date),
        day: date.getDate(),
        dayName: this.dayNames[date.getDay()],
        dayNameShort: this.dayNamesShort[date.getDay()],
        isToday: this.isToday(date),
        agendamentos: this.getAgendamentosForDate(date),
        timeSlots: this.generateDayTimeSlots(date)
      };

      this.weekDays.push(dayInfo);
    }
  }

  // Obter início da semana (domingo)
  getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek;
  }

  // Gerar slots de horário para um dia específico
  generateDayTimeSlots(date: Date): any[] {
    return this.timeSlots.map(timeSlot => {
      const [hour, minute] = timeSlot.split(':');
      const slotDateTime = new Date(date);
      slotDateTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

      const agendamento = this.todosAgendamentos.find(a => {
        if (!a.dataHora) return false;
        const agendamentoDate = new Date(a.dataHora);
        return agendamentoDate.toISOString() === slotDateTime.toISOString();
      });

      return {
        time: timeSlot,
        dateTime: slotDateTime,
        agendamento: agendamento,
        isAvailable: !agendamento
      };
    });
  }

  // Navegar para semana anterior
  previousWeek(): void {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.generateWeekView();
  }

  // Navegar para próxima semana
  nextWeek(): void {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.generateWeekView();
  }

  // Obter período da semana atual
  getCurrentWeekRange(): string {
    const startOfWeek = this.getStartOfWeek(this.currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startDay = startOfWeek.getDate();
    const endDay = endOfWeek.getDate();
    
    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startDay} - ${endDay} de ${this.monthNames[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`;
    } else {
      return `${startDay} de ${this.monthNames[startOfWeek.getMonth()]} - ${endDay} de ${this.monthNames[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`;
    }
  }

  // Clique em slot de horário
  onTimeSlotClick(dayInfo: any, timeSlot: any): void {
    if (timeSlot.agendamento) {
      // Se há agendamento, editar
      this.editarAgendamento(timeSlot.agendamento);
    } else {
      // Se não há agendamento, criar novo
      this.novoAgendamentoParaHorario(timeSlot.dateTime);
    }
  }

  // Criar novo agendamento para horário específico
  novoAgendamentoParaHorario(dateTime: Date): void {
    this.agendamentoSelecionado = null;
    
    this.formData = {
      dataHora: this.formatarDataParaInput(dateTime.toISOString()),
      nomePaciente: '',
      nomeProfissional: '',
      observacao: '',
      status: 'AGENDADO'
    };
    this.mostrarModal = true;
  }

  // Atualizar navegação baseada na visualização
  previousPeriod(): void {
    if (this.calendarView === 'week') {
      this.previousWeek();
    } else {
      this.previousMonth();
    }
  }

  nextPeriod(): void {
    if (this.calendarView === 'week') {
      this.nextWeek();
    } else {
      this.nextMonth();
    }
  }

  // Obter título baseado na visualização
  getCurrentPeriodTitle(): string {
    if (this.calendarView === 'week') {
      return this.getCurrentWeekRange();
    } else {
      return this.getCurrentMonthName();
    }
  }
}
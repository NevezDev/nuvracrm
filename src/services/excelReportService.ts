import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ReportData {
  contacts: any[];
  leads: any[];
  deals: any[];
  activities: any[];
}

export interface ReportOptions {
  dateRange: string;
  startDate: Date;
  endDate: Date;
  includeCharts?: boolean;
  reportType?: 'overview' | 'sales' | 'leads' | 'activities' | 'financial';
}

export class ExcelReportService {
  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private static formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  }

  private static formatDateTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  }

  private static createSummarySheet(data: ReportData, options: ReportOptions): XLSX.WorkSheet {
    const stats = this.calculateStats(data);
    
    const summaryData = [
      ['RELATÓRIO NUVRA CRM - RESUMO EXECUTIVO'],
      [''],
      ['Período:', `${this.formatDate(options.startDate)} a ${this.formatDate(options.endDate)}`],
      ['Gerado em:', this.formatDateTime(new Date())],
      [''],
      ['MÉTRICAS PRINCIPAIS'],
      ['Total de Contatos', stats.totalContacts],
      ['Total de Leads', stats.totalLeads],
      ['Total de Oportunidades', stats.totalDeals],
      ['Total de Atividades', stats.totalActivities],
      [''],
      ['PERFORMANCE FINANCEIRA'],
      ['Receita Total', this.formatCurrency(stats.totalRevenue)],
      ['Valor do Pipeline', this.formatCurrency(stats.pipelineValue)],
      ['Ticket Médio', this.formatCurrency(stats.avgDealValue)],
      ['Taxa de Conversão', `${stats.conversionRate.toFixed(1)}%`],
      [''],
      ['DISTRIBUIÇÃO POR STATUS'],
      ['Leads Novos', stats.leadsByStatus.new],
      ['Leads Contatados', stats.leadsByStatus.contacted],
      ['Leads Qualificados', stats.leadsByStatus.qualified],
      ['Leads Perdidos', stats.leadsByStatus.lost],
      [''],
      ['Deals em Prospecção', stats.dealsByStatus.prospecting],
      ['Deals em Negociação', stats.dealsByStatus.negotiation],
      ['Deals Fechados (Ganhos)', stats.dealsByStatus.closed_won],
      ['Deals Fechados (Perdidos)', stats.dealsByStatus.closed_lost],
      [''],
      ['ATIVIDADES'],
      ['Ligações', stats.activitiesByType.call],
      ['E-mails', stats.activitiesByType.email],
      ['Reuniões', stats.activitiesByType.meeting],
      ['Tarefas', stats.activitiesByType.task],
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Formatação
    ws['!cols'] = [{ width: 25 }, { width: 20 }];
    
    return ws;
  }

  private static createContactsSheet(contacts: any[]): XLSX.WorkSheet {
    const headers = [
      'ID',
      'Nome',
      'E-mail',
      'Telefone',
      'Empresa',
      'Cargo',
      'Status',
      'Data de Criação',
      'Última Atualização'
    ];

    const contactsData = contacts.map(contact => [
      contact.id,
      contact.name,
      contact.email,
      contact.phone || '',
      contact.company || '',
      contact.position || '',
      contact.status === 'active' ? 'Ativo' : 'Inativo',
      this.formatDateTime(contact.created_at),
      this.formatDateTime(contact.updated_at)
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...contactsData]);
    
    // Formatação das colunas
    ws['!cols'] = [
      { width: 10 }, // ID
      { width: 25 }, // Nome
      { width: 30 }, // E-mail
      { width: 15 }, // Telefone
      { width: 25 }, // Empresa
      { width: 20 }, // Cargo
      { width: 10 }, // Status
      { width: 18 }, // Data Criação
      { width: 18 }  // Última Atualização
    ];

    return ws;
  }

  private static createLeadsSheet(leads: any[]): XLSX.WorkSheet {
    const headers = [
      'ID',
      'Nome',
      'E-mail',
      'Telefone',
      'Empresa',
      'Origem',
      'Status',
      'Valor Estimado',
      'Nível de Interesse',
      'Data de Criação',
      'Última Atualização'
    ];

    const statusLabels = {
      new: 'Novo',
      contacted: 'Contatado',
      qualified: 'Qualificado',
      lost: 'Perdido'
    };

    const leadsData = leads.map(lead => [
      lead.id,
      lead.name,
      lead.email,
      lead.phone || '',
      lead.company || '',
      lead.source,
      statusLabels[lead.status as keyof typeof statusLabels] || lead.status,
      this.formatCurrency(lead.value || 0),
      lead.interest_level || '',
      this.formatDateTime(lead.created_at),
      this.formatDateTime(lead.updated_at)
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...leadsData]);
    
    ws['!cols'] = [
      { width: 10 }, // ID
      { width: 25 }, // Nome
      { width: 30 }, // E-mail
      { width: 15 }, // Telefone
      { width: 25 }, // Empresa
      { width: 15 }, // Origem
      { width: 12 }, // Status
      { width: 15 }, // Valor
      { width: 18 }, // Interesse
      { width: 18 }, // Data Criação
      { width: 18 }  // Última Atualização
    ];

    return ws;
  }

  private static createDealsSheet(deals: any[]): XLSX.WorkSheet {
    const headers = [
      'ID',
      'Título',
      'Descrição',
      'Valor',
      'Status',
      'Probabilidade (%)',
      'Data Esperada',
      'Data de Criação',
      'Última Atualização'
    ];

    const statusLabels = {
      prospecting: 'Prospecção',
      negotiation: 'Negociação',
      closed_won: 'Fechado - Ganho',
      closed_lost: 'Fechado - Perdido'
    };

    const dealsData = deals.map(deal => [
      deal.id,
      deal.title,
      deal.description || '',
      this.formatCurrency(deal.value),
      statusLabels[deal.status as keyof typeof statusLabels] || deal.status,
      deal.probability ? `${deal.probability}%` : '',
      deal.expected_close_date ? this.formatDate(deal.expected_close_date) : '',
      this.formatDateTime(deal.created_at),
      this.formatDateTime(deal.updated_at)
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dealsData]);
    
    ws['!cols'] = [
      { width: 10 }, // ID
      { width: 30 }, // Título
      { width: 40 }, // Descrição
      { width: 15 }, // Valor
      { width: 18 }, // Status
      { width: 15 }, // Probabilidade
      { width: 15 }, // Data Esperada
      { width: 18 }, // Data Criação
      { width: 18 }  // Última Atualização
    ];

    return ws;
  }

  private static createActivitiesSheet(activities: any[]): XLSX.WorkSheet {
    const headers = [
      'ID',
      'Título',
      'Descrição',
      'Tipo',
      'Status',
      'Data de Vencimento',
      'Contato',
      'Deal',
      'Data de Criação',
      'Última Atualização'
    ];

    const typeLabels = {
      call: 'Ligação',
      email: 'E-mail',
      meeting: 'Reunião',
      task: 'Tarefa'
    };

    const statusLabels = {
      pending: 'Pendente',
      completed: 'Concluída',
      cancelled: 'Cancelada'
    };

    const activitiesData = activities.map(activity => [
      activity.id,
      activity.title,
      activity.description || '',
      typeLabels[activity.type as keyof typeof typeLabels] || activity.type,
      statusLabels[activity.status as keyof typeof statusLabels] || activity.status,
      activity.due_date ? this.formatDateTime(activity.due_date) : '',
      activity.contacts?.name || '',
      activity.deals?.title || '',
      this.formatDateTime(activity.created_at),
      this.formatDateTime(activity.updated_at)
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...activitiesData]);
    
    ws['!cols'] = [
      { width: 10 }, // ID
      { width: 30 }, // Título
      { width: 40 }, // Descrição
      { width: 12 }, // Tipo
      { width: 12 }, // Status
      { width: 18 }, // Vencimento
      { width: 25 }, // Contato
      { width: 25 }, // Deal
      { width: 18 }, // Data Criação
      { width: 18 }  // Última Atualização
    ];

    return ws;
  }

  private static calculateStats(data: ReportData) {
    const { contacts, leads, deals, activities } = data;

    const totalRevenue = deals
      .filter(deal => deal.status === 'closed_won')
      .reduce((sum, deal) => sum + (deal.value || 0), 0);

    const pipelineValue = deals
      .filter(deal => ['prospecting', 'negotiation'].includes(deal.status))
      .reduce((sum, deal) => sum + (deal.value || 0), 0);

    const conversionRate = leads.length > 0 
      ? (deals.filter(d => d.status === 'closed_won').length / leads.length) * 100 
      : 0;

    const avgDealValue = deals.length > 0 
      ? deals.reduce((sum, deal) => sum + (deal.value || 0), 0) / deals.length 
      : 0;

    const leadsByStatus = {
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      lost: leads.filter(l => l.status === 'lost').length
    };

    const dealsByStatus = {
      prospecting: deals.filter(d => d.status === 'prospecting').length,
      negotiation: deals.filter(d => d.status === 'negotiation').length,
      closed_won: deals.filter(d => d.status === 'closed_won').length,
      closed_lost: deals.filter(d => d.status === 'closed_lost').length
    };

    const activitiesByType = {
      call: activities.filter(a => a.type === 'call').length,
      email: activities.filter(a => a.type === 'email').length,
      meeting: activities.filter(a => a.type === 'meeting').length,
      task: activities.filter(a => a.type === 'task').length
    };

    return {
      totalContacts: contacts.length,
      totalLeads: leads.length,
      totalDeals: deals.length,
      totalActivities: activities.length,
      totalRevenue,
      pipelineValue,
      conversionRate,
      avgDealValue,
      leadsByStatus,
      dealsByStatus,
      activitiesByType
    };
  }

  public static generateExcelReport(data: ReportData, options: ReportOptions): void {
    const workbook = XLSX.utils.book_new();

    // Criar abas do relatório
    const summarySheet = this.createSummarySheet(data, options);
    const contactsSheet = this.createContactsSheet(data.contacts);
    const leadsSheet = this.createLeadsSheet(data.leads);
    const dealsSheet = this.createDealsSheet(data.deals);
    const activitiesSheet = this.createActivitiesSheet(data.activities);

    // Adicionar abas ao workbook
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
    XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contatos');
    XLSX.utils.book_append_sheet(workbook, leadsSheet, 'Leads');
    XLSX.utils.book_append_sheet(workbook, dealsSheet, 'Oportunidades');
    XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Atividades');

    // Gerar arquivo
    const fileName = `relatorio-nuvra-crm-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  public static generateSpecificReport(
    data: ReportData, 
    options: ReportOptions, 
    reportType: 'sales' | 'leads' | 'activities' | 'financial'
  ): void {
    const workbook = XLSX.utils.book_new();

    switch (reportType) {
      case 'sales':
        const salesSummary = this.createSalesSummarySheet(data, options);
        const dealsSheet = this.createDealsSheet(data.deals);
        XLSX.utils.book_append_sheet(workbook, salesSummary, 'Resumo de Vendas');
        XLSX.utils.book_append_sheet(workbook, dealsSheet, 'Oportunidades');
        break;

      case 'leads':
        const leadsSummary = this.createLeadsSummarySheet(data, options);
        const leadsSheet = this.createLeadsSheet(data.leads);
        XLSX.utils.book_append_sheet(workbook, leadsSummary, 'Resumo de Leads');
        XLSX.utils.book_append_sheet(workbook, leadsSheet, 'Leads');
        break;

      case 'activities':
        const activitiesSummary = this.createActivitiesSummarySheet(data, options);
        const activitiesSheet = this.createActivitiesSheet(data.activities);
        XLSX.utils.book_append_sheet(workbook, activitiesSummary, 'Resumo de Atividades');
        XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Atividades');
        break;

      case 'financial':
        const financialSummary = this.createFinancialSummarySheet(data, options);
        const financialDeals = this.createFinancialDealsSheet(data.deals);
        XLSX.utils.book_append_sheet(workbook, financialSummary, 'Resumo Financeiro');
        XLSX.utils.book_append_sheet(workbook, financialDeals, 'Análise Financeira');
        break;
    }

    const fileName = `relatorio-${reportType}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private static createSalesSummarySheet(data: ReportData, options: ReportOptions): XLSX.WorkSheet {
    const stats = this.calculateStats(data);
    
    const salesData = [
      ['RELATÓRIO DE VENDAS - NUVRA CRM'],
      [''],
      ['Período:', `${this.formatDate(options.startDate)} a ${this.formatDate(options.endDate)}`],
      [''],
      ['PERFORMANCE DE VENDAS'],
      ['Total de Oportunidades', stats.totalDeals],
      ['Oportunidades Fechadas (Ganhas)', stats.dealsByStatus.closed_won],
      ['Oportunidades Fechadas (Perdidas)', stats.dealsByStatus.closed_lost],
      ['Taxa de Fechamento', `${stats.dealsByStatus.closed_won > 0 ? ((stats.dealsByStatus.closed_won / stats.totalDeals) * 100).toFixed(1) : 0}%`],
      [''],
      ['VALORES'],
      ['Receita Total', this.formatCurrency(stats.totalRevenue)],
      ['Valor do Pipeline', this.formatCurrency(stats.pipelineValue)],
      ['Ticket Médio', this.formatCurrency(stats.avgDealValue)],
      [''],
      ['PIPELINE'],
      ['Em Prospecção', stats.dealsByStatus.prospecting],
      ['Em Negociação', stats.dealsByStatus.negotiation],
    ];

    const ws = XLSX.utils.aoa_to_sheet(salesData);
    ws['!cols'] = [{ width: 25 }, { width: 20 }];
    return ws;
  }

  private static createLeadsSummarySheet(data: ReportData, options: ReportOptions): XLSX.WorkSheet {
    const stats = this.calculateStats(data);
    
    const leadsData = [
      ['RELATÓRIO DE LEADS - NUVRA CRM'],
      [''],
      ['Período:', `${this.formatDate(options.startDate)} a ${this.formatDate(options.endDate)}`],
      [''],
      ['PERFORMANCE DE LEADS'],
      ['Total de Leads', stats.totalLeads],
      ['Leads Qualificados', stats.leadsByStatus.qualified],
      ['Taxa de Qualificação', `${stats.totalLeads > 0 ? ((stats.leadsByStatus.qualified / stats.totalLeads) * 100).toFixed(1) : 0}%`],
      ['Taxa de Conversão', `${stats.conversionRate.toFixed(1)}%`],
      [''],
      ['DISTRIBUIÇÃO POR STATUS'],
      ['Novos', stats.leadsByStatus.new],
      ['Contatados', stats.leadsByStatus.contacted],
      ['Qualificados', stats.leadsByStatus.qualified],
      ['Perdidos', stats.leadsByStatus.lost],
    ];

    const ws = XLSX.utils.aoa_to_sheet(leadsData);
    ws['!cols'] = [{ width: 25 }, { width: 20 }];
    return ws;
  }

  private static createActivitiesSummarySheet(data: ReportData, options: ReportOptions): XLSX.WorkSheet {
    const stats = this.calculateStats(data);
    const completedActivities = data.activities.filter(a => a.status === 'completed').length;
    
    const activitiesData = [
      ['RELATÓRIO DE ATIVIDADES - NUVRA CRM'],
      [''],
      ['Período:', `${this.formatDate(options.startDate)} a ${this.formatDate(options.endDate)}`],
      [''],
      ['PERFORMANCE DE ATIVIDADES'],
      ['Total de Atividades', stats.totalActivities],
      ['Atividades Concluídas', completedActivities],
      ['Taxa de Conclusão', `${stats.totalActivities > 0 ? ((completedActivities / stats.totalActivities) * 100).toFixed(1) : 0}%`],
      [''],
      ['DISTRIBUIÇÃO POR TIPO'],
      ['Ligações', stats.activitiesByType.call],
      ['E-mails', stats.activitiesByType.email],
      ['Reuniões', stats.activitiesByType.meeting],
      ['Tarefas', stats.activitiesByType.task],
    ];

    const ws = XLSX.utils.aoa_to_sheet(activitiesData);
    ws['!cols'] = [{ width: 25 }, { width: 20 }];
    return ws;
  }

  private static createFinancialSummarySheet(data: ReportData, options: ReportOptions): XLSX.WorkSheet {
    const stats = this.calculateStats(data);
    
    const financialData = [
      ['RELATÓRIO FINANCEIRO - NUVRA CRM'],
      [''],
      ['Período:', `${this.formatDate(options.startDate)} a ${this.formatDate(options.endDate)}`],
      [''],
      ['RECEITA'],
      ['Receita Realizada', this.formatCurrency(stats.totalRevenue)],
      ['Receita em Pipeline', this.formatCurrency(stats.pipelineValue)],
      ['Receita Potencial Total', this.formatCurrency(stats.totalRevenue + stats.pipelineValue)],
      [''],
      ['ANÁLISE DE DEALS'],
      ['Ticket Médio', this.formatCurrency(stats.avgDealValue)],
      ['Maior Deal', this.formatCurrency(Math.max(...data.deals.map(d => d.value || 0)))],
      ['Menor Deal', this.formatCurrency(Math.min(...data.deals.filter(d => d.value > 0).map(d => d.value || 0)))],
    ];

    const ws = XLSX.utils.aoa_to_sheet(financialData);
    ws['!cols'] = [{ width: 25 }, { width: 20 }];
    return ws;
  }

  private static createFinancialDealsSheet(deals: any[]): XLSX.WorkSheet {
    const headers = [
      'Título',
      'Valor',
      'Status',
      'Probabilidade (%)',
      'Valor Ponderado',
      'Data Esperada',
      'Dias para Fechamento'
    ];

    const statusLabels = {
      prospecting: 'Prospecção',
      negotiation: 'Negociação',
      closed_won: 'Fechado - Ganho',
      closed_lost: 'Fechado - Perdido'
    };

    const dealsData = deals.map(deal => {
      const probability = deal.probability || 0;
      const weightedValue = (deal.value || 0) * (probability / 100);
      const daysToClose = deal.expected_close_date 
        ? Math.ceil((new Date(deal.expected_close_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : '';

      return [
        deal.title,
        this.formatCurrency(deal.value || 0),
        statusLabels[deal.status as keyof typeof statusLabels] || deal.status,
        probability ? `${probability}%` : '',
        this.formatCurrency(weightedValue),
        deal.expected_close_date ? this.formatDate(deal.expected_close_date) : '',
        daysToClose
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dealsData]);
    
    ws['!cols'] = [
      { width: 30 }, // Título
      { width: 15 }, // Valor
      { width: 18 }, // Status
      { width: 15 }, // Probabilidade
      { width: 18 }, // Valor Ponderado
      { width: 15 }, // Data Esperada
      { width: 20 }  // Dias para Fechamento
    ];

    return ws;
  }
}
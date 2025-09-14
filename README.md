# AgendamentoFront

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## 📋 Configuração de Ambientes

Este projeto possui diferentes configurações de ambiente para desenvolvimento e produção:

### Ambientes Disponíveis

| Comando | Frontend | Backend | Console Log | Descrição |
|---------|----------|---------|-------------|-----------|
| `ng serve` | **Local** (localhost:4200) | **Local** (localhost:8080) | 🟢 DESENVOLVIMENTO | Desenvolvimento completo local |
| `ng serve --configuration=local-prod` | **Local** (localhost:4200) | **VPS** (agendamento.conect365.com) | 🟡 DESENVOLVIMENTO + VPS | Frontend local + Backend VPS |
| `ng build` | **Build para VPS** | **VPS** (agendamento.conect365.com) | 🔴 PRODUÇÃO | Build para deploy |

### Arquivos de Environment

- **`src/environments/environment.ts`** - Desenvolvimento (localhost:8080)
- **`src/environments/environment.prod.ts`** - Produção (agendamento.conect365.com)  
- **`src/environments/environment.local-prod.ts`** - Híbrido (local + VPS)

### Como Verificar o Ambiente

Abra o **Console do Navegador** (F12) e procure por:
```
🌍 Ambiente atual: [DESENVOLVIMENTO|PRODUÇÃO]
🔗 API URL: [URL_DA_API]
```

### Comandos Úteis

```bash
# Desenvolvimento local completo
ng serve

# Frontend local + Backend VPS (útil para testar com dados reais)
ng serve --configuration=local-prod

# Build para desenvolvimento
ng build --configuration=development

# Build para produção (deploy)
ng build --configuration=production
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

# Aprovação e homologação

**Status: proposta — não homologada.**

```mermaid
flowchart TD
    A["Proposta refinada"] --> B["Identificar autoridade competente"]
    B --> C{"Validação de escopo"}
    C -- "Ajustes" --> A
    C -- "Recusa fundamentada" --> R["Registrar decisão"]
    C -- "Aprovação" --> D["Implementação"]
    D --> E["Revisão técnica independente"]
    E --> F{"Testes e critérios atendidos?"}
    F -- "Não" --> D
    F -- "Sim" --> G["Apresentação com evidências"]
    G --> H{"Homologação institucional"}
    H -- "Solicitar ajustes" --> D
    H -- "Mudou o escopo" --> A
    H -- "Recusa fundamentada" --> R
    H -- "Aprovado" --> I["Encaminhar publicação autorizada"]
```

## Evidências mínimas para decisão

- Issue e PR ou versão avaliada;
- resultado esperado e critérios de aceite;
- evidências de revisão/testes;
- aprovador e sua competência;
- data, resultado e justificativa;
- providência em caso de ajustes ou recusa.

**Importante:** a aprovação de código no GitHub não autoriza automaticamente a implantação em sistemas ou domínios da Unimontes.

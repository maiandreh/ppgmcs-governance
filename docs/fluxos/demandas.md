# Fluxo de demandas

**Status: proposta — ainda não aprovada.**

```mermaid
flowchart TD
    A["Problema ou oportunidade (Issue)"] --> B["Triagem e classificação"]
    B --> C["Refinamento: público, regras, critérios de aceite"]
    C --> D{"Escopo institucional requer validação?"}
    D -- "Sim" --> E{"Decisão da autoridade competente"}
    E -- "Ajustar" --> C
    E -- "Recusar" --> R["Registrar motivo e encerrar"]
    E -- "Aprovar" --> F["Pronta para execução"]
    D -- "Não" --> F
    F --> G["Execução e documentação"]
    G --> H["Revisão técnica, testes e acessibilidade"]
    H --> I{"Atende critérios de aceite?"}
    I -- "Não" --> G
    I -- "Sim" --> J{"Homologação necessária?"}
    J -- "Sim" --> K{"Homologação institucional"}
    K -- "Ajustes" --> G
    K -- "Escopo mudou" --> C
    K -- "Recusado" --> R
    K -- "Aprovado" --> L["Entrega/publicação autorizada"]
    J -- "Não" --> L
    L --> M["Registro e acompanhamento"]
```

## Estados sugeridos no GitHub Projects

Proposta → Triagem → Refinamento → Aguardando validação → Pronta → Em execução → Em revisão → Em homologação → Concluída.

Demandas bloqueadas ou recusadas devem ter motivo rastreável. Nem toda correção técnica exige uma nova homologação acadêmica. Já alterações de processo, regra ou conteúdo oficial precisam de autoridade identificada.

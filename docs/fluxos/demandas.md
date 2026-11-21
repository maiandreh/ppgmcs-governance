# Fluxo de demandas

**Entrada operacional:** [Google Forms](https://docs.google.com/forms/d/e/1FAIpQLScMfcz1FtOyBGHIW5whgcdp14P3vui7PoHPUHSfkJieHMIk-g/viewform). As etapas de governança e aprovação abaixo continuam propostas para deliberação.

```mermaid
flowchart TD
    A["Solicitante preenche Google Forms"] --> S["Sheets registra resposta e identificador"]
    S --> T["Apps Script cria ou reconcilia Issue pública"]
    T --> B["Triagem e classificação"]
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

A entrada de uma demanda ocorre **pelo formulário**, não pela abertura manual de Issue. Problemas internos de infraestrutura podem ser registrados diretamente pelos mantenedores. Consulte [fluxo detalhado de entrada](entrada-formulario.md).

## Estados sugeridos no GitHub Projects

Proposta → Triagem → Refinamento → Aguardando validação → Pronta → Em execução → Em revisão → Em homologação → Concluída.

Demandas bloqueadas ou recusadas devem ter motivo rastreável. Nem toda correção técnica exige uma nova homologação acadêmica. Já alterações de processo, regra ou conteúdo oficial precisam de autoridade identificada.

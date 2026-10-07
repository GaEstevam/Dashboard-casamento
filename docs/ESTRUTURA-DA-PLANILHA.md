# Estrutura da planilha

O importador procura as abas pelo nome, ignorando diferenças de maiúsculas, minúsculas e acentos. Linhas de título antes do cabeçalho são permitidas.

As colunas não precisam estar na mesma ordem, mas os nomes devem permanecer reconhecíveis.

## Abas principais

### `Configurações`

Formato de chave e valor nas duas primeiras colunas.

| Chave                 | Exemplo      |
| --------------------- | ------------ |
| Nome da pessoa 1      | Alex Exemplo |
| Nome da pessoa 2      | Dani Exemplo |
| Data do casamento     | 18/11/2028   |
| Orçamento total       | R$ 50.000,00 |
| Convidados planejados | 200          |
| Cidade                | Sua cidade   |

### `Convidados`

Colunas utilizadas:

- `ID`
- `Nome ou grupo`
- `Família / grupo`
- `Lado`
- `Convite enviado?`
- `RSVP`
- `Acompanhantes`
- `Total de pessoas`
- `Adultos` e `Crianças` — opcionais
- `Restrição alimentar`
- `Mesa`

### `Orçamento`

- `Categoria`
- `Planejado`
- `Contratado`
- `Pago`

A linha `TOTAL` é ignorada porque os totais são recalculados no dashboard.

### `Pagamentos`

- `ID`
- `Fornecedor / item`
- `Categoria`
- `Vencimento`
- `Valor`
- `Pago?`
- `Forma`
- `Situação`

### `Cronograma geral`

- `ID`
- `Marco`
- `Fase`
- `Data de início`
- `Data final`
- `Responsável`
- `Status`

### `Checklist`

- `ID`
- `Fase`
- `Tarefa`
- `Responsável`
- `Prazo sugerido` ou `Prazo ajustado`
- `Status`
- `Prioridade`

### `Prioridades`

O importador procura `Tarefa` ou `Item`, além de prazo, responsável, status, fase e prioridade quando disponíveis.

### `Fornecedores`

- `ID`
- `Tipo`
- `Categoria do orçamento`
- `Empresa / profissional`
- `Contato`
- `Telefone`
- `E-mail`
- `Valor contratado`
- `Valor pago`
- `Contrato assinado?`
- `Status`
- `Próximo vencimento`
- `Link`

## Valores reconhecidos

- Campos booleanos aceitam `Sim`, `Pago`, `true` ou `1`.
- Valores monetários podem usar o formato brasileiro, como `R$ 1.250,00`.
- Datas devem preferencialmente usar `dd/mm/aaaa`.
- Status são interpretados por texto, por exemplo `Confirmado`, `Aguardando`, `Em andamento`, `Concluída` e `Atrasado`.

## Abas ausentes

As abas `Configurações`, `Convidados`, `Orçamento`, `Cronograma geral`, `Pagamentos` e `Fornecedores` são verificadas na importação. Se alguma não existir, o dashboard mostra um aviso e mantém a área correspondente vazia.

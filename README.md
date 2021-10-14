# Repositório de customizações

Olá, esse é o repositório de customizações para uma operação Beon. Nesse projeto você realizará as customizações necessárias para que o Beon possa operar dentro dos sites dos nossos clientes.

É importante que você observe as orientações contidas aqui, e esteja sempre disposto a sugerir melhorias, corrigir bugs, complementar a documentação do projeto.

```
Atenção: Não clone esse repositório diretamente.

Crie um fork dele e submeta seus Pull Requests para o repositório de origem.
```

## Como funciona

Esse repositório contém os arquivos de referência para a customização de uma nova operação cliente do Beon. Abaixo você encontrará mais informações sobre os diretórios, componentes, e sobre como iniciar o desenvolvimento em sua máquina local.

Basicamente:

- Para o desenvolvimento você precisa do `gulp` e `nodemon` instalados globalmente. Saiba mais [sobre as dependências do projeto](#dependências-do-projeto).

- É necessário a utilização de uma chave SSH para autenticação no GitHub. O acesso aos repositórios do projeto se dará através deste método. Saiba mais em: [Conectar-se ao GitHub com SSH](https://docs.github.com/pt/github/authenticating-to-github/connecting-to-github-with-ssh).

- Existem algumas observações sobre este projeto em ambientes Windows. Veja as [considerações sobre ambientes Windows](#considerações-sobre-ambientes-windows).

- Você precisa inicializar o submódulo `base`. Ele contém alguns arquivos importantes para seu trabalho. Veja [como inicializar o submódulo base](#o-que-é-o-submódulo-base).

- Você atuará _apenas_ no diretório `custom`. Entenda a [estrutura e componentes para customização](#estrutura-e-componentes-para-customização).

- Leia as [orientações sobre desenvolvimento](#orientações-sobre-o-desenvolvimento).

- Tudo o que você precisa customizar estará visível em [http://localhost:5000/teste/sample](http://localhost:5000/teste/sample).

- Uma vez terminado, submeta um Pull Request para seu repositório de origem (`beonica/bn.tenant.custom.{nome da operação}`) para avaliação. Mais informações sobre [boas práticas para o Pull Request](#boas-práticas-para-commits-e-pull-requests)

- Qualquer mudança que entenda necessária em outro diretório ou arquivo deve ser feita no repositório `beonica/bn.tenant.custom.template` e um PR submetido para análise. [Mais informações sobre contribuição com os repositórios do Beon](#como-contribuir-com-os-repositórios-beon).

# Instruções para iniciar

## Dependências do projeto

### Gulp

Utilizado como gerenciador de tarefas, o Gulp precisa estar instalado globalmente na sua máquina para funcionar.

```
npm install -g gulp
```

### Nodemon

É um process manager, monitorando o script e reiniciando o mesmo caso seja alterado ou o processo quebre. Instale globalmente para funcionar.

```
npm install -g nodemon
```

## O que é o submódulo base

`/src/base` é ponto de checkout de um submódulo que contém os arquivos de referência dos componentes do Beon, que podem ser referenciados nos arquivos de customização.

Não altere diretamente os arquivos desse diretório. Se atualizações de base forem necessárias, dê uma olhada em [Como contribuir com os repositórios Beon](#como-contribuir-com-os-repositórios-beon).

### Para inicializar o submódulo

Esse submódulo é inicializado junto com o start do projeto pelo script `npm run init`. **Rode este comando no diretório raiz do projeto como o primeiro após realizar o fork com sucesso - conforme explicado a seguir.**

> ✋ **Nota importante!**
> Caso você possua ambiente Windows o comando `npm run init` pode não funcionar por conta da limitação deste OS para rodar comandos concatenados. Portanto execute os comandos descritos no link logo abaixo para Inicializar o submódulo e depois siga o roteiro descrito em [Para iniciar o desenvolvimento](#para-iniciar-o-desenvolvimento)

O repositório base pode ser reinicializado sempre que necessário. Caso você precise realizar este procedimento manualmente acesse: [Como (re)inicializar e/ou atualizar o submódulo base.][submodule]

[submodule]: #como-(re)inicializar-ou-atualizar-os-arquivos-do-submódulo

#### Para inicializar o projeto de customização:

Execute o script `init` na raiz do repositório

```
npm run init
```

Esse script executará um conjunto de ações no seu projeto:

1. Inicializa, atualiza e faz uma instalação limpa dos pacotes npm no repositório base. [Entenda](#para-reinicializar-ou-atualizar-os-arquivos-do-submódulo).
2. Executa uma instalação dos pacotes npm no diretório raiz.

#### Para iniciar o desenvolvimento:

1. Inicie o script de desenvolvimento

```
npm run dev
```

Esse script executará dois processos simultâneos: `gulp dev` e `nodemon sever.js`, disponibilizando a porta 5000 no navegador e também executando as tarefas de automação necessárias.

2. No navegador, acesse o `sample.html` em `http://localhost:5000/teste/sample`.

Nesse projeto o `nodemon` é utilizado para servir os arquivos estáticos para os testes. Se tiver problemas para rodá-lo , execute o servidor estático manualmente.

```
# na raiz do projeto
node server.js
```

> ✋ **Nota importante!**
> Se estiver usando ambiente Windows, considere dar uma olhada em [Considerações sobre ambientes Windows](#considerações-sobre-ambientes-windows).

## Estrutura e componentes para customização

O diretório `/src/custom` contém os arquivos de customização da operação. A estrutura é parecida com essa:

```
/src
  /custom
    /css
      /modules
        ...
      beon.css
      _vars.scss
    /html
      /sample.html
```

# Orientações sobre o desenvolvimento

Durante o desenvolvimento das customizações, você precisa se atentar a alguns detalhes de controle de qualidade que serão observados durante a validação da entrega:

- Performance responsiva dos componentes.
- Atenção a pequenos detalhes, como espaçamentos.
- Efeitos de interaface, como mouse overs.
- Fidedignidade geral com a identidade do cliente.

## Responsividade

Trabalhamos com cinco breakpoints, sendo que alguns deles podem não ser tratados na interface do cliente e você precisa ajustar a customização de acordo.

### Breakpoints:

Aplicamos o conceito Mobile First, note que os breakpoints indicam o ponto no qual passamos a considerar a mudança de tela, e não seu limite.

Alguns mixins estão disponíveis para gerenciamento das media queries, e as variáveis que determinam os limites dos breakpoints podem ser sobrescritas no seu `_vars.scss`.

Definições:

- Smartphones: telas até 599px
  - `variável $for-phone-only`
  - `mixin for-phone-only`
- Tablet vertical: telas a partir de 600px
  - `variável $for-tablet-portrait-up`
  - `mixin for-tablet-portrait-up`
- Tablet horizontal: telas a partir de 900px
  - `variável $for-tablet-landscape-up`
  - `mixin for-tablet-landscape-up`
- Desktop: telas a partir de 1200px
  - `variável $for-desktop-up`
  - `mixin for-desktop-up`
- Grandes telas: a partir de 1800px
  - `variável $for-big-desktop-up`
  - `mixin for-big-desktop-up`

### Exemplo de uso dos mixins:

```scss
.texto {
  /* afeta todos os dispositivos, iniciando pelos mobile. */
  font-size: 1em;

  @include for-tablet-portrait-up {
    font-size: 1.1em;
  }

  @include for-tablet-landscape-up {
    font-size: 1.2em;
  }

  @include for-desktop-up {
    font-size: 1.5em;
  }

  @include for-big-desktop-up {
    font-size: 2em;
  }
}
```

### Validação

Sempre testamos nos dispositivos abaixo para garantir a qualidade. Todos podem ser simulados em seu navegador:

- iPhone XS
- iPad Pro (portrait e landscape)
- Monitor 1024
- Monitor 1360 (notebooks SD)
- Monitor 1440 (notebooks HD)
- Monitor 1920 (telas Full HD)
- Monitor 4k (retina)

## Efeitos de UI

**[wip]**

# Boas práticas para Commits e Pull Requests

[wip]

# Considerações sobre ambientes Windows

## Comandos e Scripts

Algumas diferenças entre ambientes Windows e Unix podem quebrar os scripts associados a esse projeto.

Abaixo listamos alguns problemas conhecidos:

**npm run init** pode falhar pela falta de suporte a processos simultâneos (&) ou pela navegação entre diretórios (cd ./src/base).

Solução:

- Realize a inicialização do submódulo base manualmente. [Entenda][submodule].
- Instale as dependências do projeto na raiz com o comando `npm install`

**npm run dev** pode falhar pela falta de suporte a processos simultâneos (&).

Solução:

- Em uma janela do terminal, na raiz do projeto execute o comando `gulp dev`. Mantenha a janela aberta, esse processo observa e compila seus arquivos Saas.
- Em uma nova janela do terminal, na raiz do projeto execute o comando `nodemon server.js`. Mantenha a janela aberta, esse processo mantém a porta 5000 aberta para que rode seus testes.

## Autenticação via SSH no GitHub

Tanto o submódulo base quanto o clone dos repositórios devem ocorrer via autenticação por SSH. É mais seguro e evita problemas que podem prejudicar seu workflow.

Garanta que o clone seja feito por SSH e não HTTPS. Para ter certeza, após clonar seu repositório rode o comando abaixo no seu terminal:

```
git remote show origin
```

A saída deve se parecer com isso (note o git@github.com, se aparecer https:// aqui, está errado):

```
~/workspace/bn.tenant.custom.bagaggio
▶ git remote show origin
* remote origin
  Fetch URL: git@github.com:beonica/bn.tenant.custom.bagaggio.git
  Push  URL: git@github.com:beonica/bn.tenant.custom.bagaggio.git
  HEAD branch: master
  Remote branch:
    master tracked
  Local branch configured for 'git pull':
    master merges with remote master
  Local ref configured for 'git push':
    master pushes to master (up to date)
```

Siga [essa documentação do GitHub](https://docs.github.com/pt/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) para te ajudar a configurar corretamente sua autenticação com SSH no Windows.

# Para (re)inicializar ou atualizar os arquivos do submódulo:

1. No raiz do projeto rode os comandos para o submódulo

```
git submodule init
git submodule update --remote
```

Quando será necessário atualizar o submódulo:

- Quanto você for informado que alguma atualização importante nos componentes base está disponível.
- Quando um novo componente for disponibilizado no submódulo base e você precisa atualizar a bundle do cliente.

Quando um desses eventos ocorrer, basta seguir as etapas abaixo:

1. Simplesmente atualize os submódulos do projeto

```
git submodule update --remote
```

2. Atualize as dependências do submódulo

```
# no diretório /src/base
npm ci
```

3. Atualize sua bundle local para validação

```
# na raiz do projeto
npm run dev
npm run server
```

# Como contribuir com os repositórios Beon

Dois repositórios compõe seu projeto de customização: o repositório do submódulo base e o repositório template, que deu origem a esse aqui.

## Repositório base

No repositório base estão os componentes originais do Beon. Contribuindo para esse repositório você estará melhorando todas as implementações do Beon.

Quando contribuir para esse repositório:

- Quando você perceber conflitos entre o CSS base e o CSS customizado, onde o ajuste pode evitar problemas futuros.
- Quando observar bugs no CSS ou JS dos componentes base, que não sejam relacionados apenas à implementação na qual estiver trabalhando.
- Quando ocorrer alguma falha nos scripts JS associados aos componentes.
- Quando estiver desenvolvendo algum componente novo.

Para contribuir, faça um fork do repositório [beonica/bn.tenant.custom.base](https://github.com/beonica/bn.tenant.custom.base) e submeta seus Pull Requests.

Você pode também incluir Issues para que possamos avaliar juntos.

## Repositório template

No repositório de template preparamos o ambiente certo para facilitar todo nosso trabalho em novas operações. Esse repositório deve receber inputs recorrentes para melhorar nossas automações de trabalho, por exemplo.

Quando contribuir para esse repositório:

- Quando percber alguma divergência entre este Readme e os processos reais.
- Quando perceber melhorias nos scripts de automação.
- Quando precisar atualizar algum detalhe no sample.html.
- Quando observer melhorias nos componentes de customização que poupariam nosso tempo em projetos futuros.

Para contribuir, faça um fork do repositório [beonica/bn.tenant.custom.template](https://github.com/beonica/bn.tenant.custom.template) e submeta seus Pull Requests.

Você pode também incluir Issues para que possamos avaliar juntos.

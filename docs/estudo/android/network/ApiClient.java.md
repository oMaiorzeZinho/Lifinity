# `network/ApiClient.java` — a fábrica do Retrofit

## Papel no projeto
É o **ponto central da comunicação com o backend**. Toda a app, sempre que precisa de falar com a API,
faz `ApiClient.getClient().create(XxxApi.class)`. Esta classe constrói **uma única** instância do
**Retrofit** (configurada com o URL base, *timeouts* e conversor de JSON) e reutiliza-a — padrão
**Singleton**.

## O que é o Retrofit (contexto)
O Retrofit é uma biblioteca que transforma **interfaces Java** (ver `api/*`) em chamadas HTTP reais. Tu
escreves um método anotado (ex.: `@GET("tasks")`) e o Retrofit gera, em tempo de execução, o código que
faz o pedido, recebe o JSON e o converte num objeto Java. Poupa imenso código repetitivo.

## Bloco a bloco
```java
private static final String BASE_URL = BuildConfig.API_BASE_URL;
private static Retrofit retrofit;
private ApiClient() { }
```
- **`BASE_URL`** vem do `BuildConfig.API_BASE_URL` — a constante gerada pelo `app/build.gradle.kts`
  (ex.: `http://192.168.1.201:3000/api/`). Mudar o IP do servidor é **uma alteração num só sítio**, sem
  tocar em Java.
- **`retrofit`** é `static` (partilhado por toda a app) e começa `null` — só se cria à primeira utilização.
- **Construtor privado** — ninguém instancia `ApiClient`; usa-se só o método estático `getClient()`. É a
  marca do padrão **Singleton/utilitário**.

```java
public static Retrofit getClient() {
    if (retrofit == null) {
        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(BuildConfig.DEBUG ? Level.BODY : Level.NONE);
        OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(loggingInterceptor)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
        retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
    }
    return retrofit;
}
```
- **`if (retrofit == null)`** — *lazy initialization*: só constrói na primeira chamada; nas seguintes
  devolve o que já existe. Eficiente (não recria ligações).
- **`HttpLoggingInterceptor`** — um "espião" que regista no Logcat os pedidos/respostas. Em **DEBUG**
  mostra o **corpo completo** (`Level.BODY`, ótimo para depurar); em *release* não mostra nada
  (`Level.NONE`) — não convém expor tráfego/tokens numa app publicada.
- **`OkHttpClient`** — o cliente HTTP que o Retrofit usa por baixo. Aqui define-se:
  - **timeouts de 30s** (ligar/ler/escrever) — em Wi-Fi local mais lenta evita "falsos erros" de rede que
    aconteceriam com o timeout curto por defeito (10s).
- **`Retrofit.Builder`** junta tudo:
  - **`baseUrl(BASE_URL)`** — prefixo de todos os caminhos das interfaces (ex.: `@GET("tasks")` →
    `http://.../api/tasks`). Por isso o BASE_URL **acaba em `/`**.
  - **`client(client)`** — usa o OkHttp configurado acima.
  - **`addConverterFactory(GsonConverterFactory.create())`** — usa o **Gson** para converter JSON ⇆
    objetos Java (`models/*`). É isto que faz um `Call<List<Task>>` "virar" uma lista de `Task`.

## Como o resto da app usa isto
```java
TaskApi taskApi = ApiClient.getClient().create(TaskApi.class);
Call<List<Task>> call = taskApi.getTasks("Bearer " + token);
call.enqueue(...);   // chamada assíncrona
```
`create(XxxApi.class)` devolve uma implementação automática da interface. Os pedidos fazem-se quase sempre
com **`.enqueue(...)`** (assíncrono, fora da *main thread*, para não bloquear o ecrã) — ver os docs das
activities.

## Ligações
- **IP/URL:** [`config/_CONFIG_GRADLE_MANIFEST.md`](../config/_CONFIG_GRADLE_MANIFEST.md) (o `buildConfigField`).
- **Interfaces que correm por aqui:** todas em [`api/`](../api/) (AuthApi, TaskApi, ...).
- **Backend correspondente:** o servidor Express documentado em `backend/`.

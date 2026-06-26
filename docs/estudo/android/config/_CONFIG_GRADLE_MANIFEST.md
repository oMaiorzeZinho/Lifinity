# Android — Configuração: Gradle + Manifest (5 ficheiros)

> Explica em conjunto os 5 ficheiros de configuração da app Android (são curtos e
> inter-relacionados): `settings.gradle.kts`, `build.gradle.kts` (raiz),
> `app/build.gradle.kts`, `gradle/libs.versions.toml` e `app/src/main/AndroidManifest.xml`.

## Porque existem
Antes de uma só linha de Java correr, o **Gradle** (a ferramenta de *build* do Android) precisa de
saber: que *plugins* usar, onde ir buscar as bibliotecas, que versão do Android alvo, que dependências
incluir, e que ecrãs (activities) e permissões a app tem. É isso que estes ficheiros declaram.
`.kts` = Kotlin Script (a linguagem de configuração do Gradle moderno).

---

## 1. `settings.gradle.kts` — repositórios e módulos do projeto
```kotlin
pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
plugins { id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0" }
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }   // Glide + MPAndroidChart
    }
}
rootProject.name = "Lifinity"
include(":app")
```
- **`pluginManagement`** — onde o Gradle vai buscar os *plugins* (ex.: o plugin Android). Usa o repositório
  `google()` (filtrado por regex para grupos `com.android.*`, `com.google.*`, `androidx.*`), o
  `mavenCentral()` e o portal de plugins.
- **`dependencyResolutionManagement`** — onde vai buscar as **bibliotecas** (dependências) do código.
  - `FAIL_ON_PROJECT_REPOS` obriga a declarar os repositórios **só aqui** (não em cada módulo) — mais
    organizado.
  - **`jitpack.io`** está aqui porque o **Glide** (imagens de avatar) e o **MPAndroidChart** (gráficos das
    Estatísticas) são publicados no JitPack, não no Maven Central.
- **`include(":app")`** — o projeto só tem **um módulo**, chamado `app` (a app em si).

## 2. `build.gradle.kts` (raiz) — configuração comum
```kotlin
plugins { alias(libs.plugins.android.application) apply false }
```
Ficheiro de topo. Declara o plugin da aplicação Android mas **`apply false`** — ou seja, **não o aplica
aqui** (a raiz não é um módulo de app); apenas o "regista" para o módulo `app` o poder aplicar. O
`libs.plugins.android.application` vem do *version catalog* (ficheiro 4).

## 3. `app/build.gradle.kts` — o ficheiro mais importante
> ⚠️ Este ficheiro **não vai para o Git** (tem o IP local na linha do `API_BASE_URL`). Cada máquina mete o
> seu IP. É por isso que aqui se documenta o conteúdo mas o ficheiro fica fora dos commits.

```kotlin
android {
    namespace = "com.lifinity.app"
    compileSdk { version = release(36) { minorApiLevel = 1 } }
    defaultConfig {
        applicationId = "com.lifinity.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
        buildConfigField("String", "API_BASE_URL", "\"http://192.168.1.201:3000/api/\"")
    }
    ...
    compileOptions { sourceCompatibility = JavaVersion.VERSION_11; targetCompatibility = ... }
    buildFeatures { buildConfig = true }
}
```
- **`namespace`/`applicationId`** = `com.lifinity.app` — o "pacote" da app (identificador único na Play Store
  e nos *imports* Java).
- **`minSdk = 24`** — corre a partir do **Android 7.0**. **`targetSdk`/`compileSdk = 36`** — compilada e
  testada contra a API 36 (Android mais recente).
- **`buildConfigField("String", "API_BASE_URL", ...)`** — a chave de tudo: gera uma constante
  `BuildConfig.API_BASE_URL` que o `ApiClient` lê. **Mudar o IP só aqui**, sem tocar em código Java. Tem de
  ser o **IP local do PC** na Wi-Fi (telemóvel e PC na mesma rede). No emulador usa-se `10.0.2.2`.
- **`buildConfig = true`** — necessário para o `buildConfigField` funcionar (gera a classe `BuildConfig`).
- **`compileOptions ... VERSION_11`** — o código Java é compilado no nível Java 11.

```kotlin
dependencies {
    implementation(libs.activity.ktx)        // ActivityResult API (photo picker), etc.
    implementation(libs.appcompat)           // AppCompatActivity, temas
    implementation(libs.constraintlayout)
    implementation(libs.material)            // Material Components (botões, temas, diálogos)
    implementation("androidx.recyclerview:recyclerview:1.3.2")  // listas
    implementation("com.squareup.retrofit2:retrofit:2.11.0")    // chamadas à API REST
    implementation("com.squareup.retrofit2:converter-gson:2.11.0") // JSON <-> objetos
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0") // log dos pedidos
    implementation("com.github.bumptech.glide:glide:4.16.0")    // imagens
    implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")  // gráficos
}
```
- **Retrofit + converter-gson** são o coração da comunicação com o backend: o Retrofit transforma
  interfaces Java (ver `api/*`) em chamadas HTTP, e o Gson converte JSON ⇆ objetos (`models/*`).
- **okhttp logging-interceptor** — mostra no Logcat os pedidos/respostas (útil para depurar). Puxa também o
  OkHttp 4 que o Retrofit usa por baixo.
- **Glide** e **MPAndroidChart** — as duas dependências do JitPack (avatares e gráficos).

## 4. `gradle/libs.versions.toml` — catálogo de versões
```toml
[versions] agp = "8.13.0"; appcompat = "1.6.1"; material = "1.10.0"; activityKtx = "1.8.0"; ...
[libraries] appcompat = { group = "androidx.appcompat", name = "appcompat", version.ref = "appcompat" } ...
[plugins] android-application = { id = "com.android.application", version.ref = "agp" }
```
- É o **"version catalog"** — centraliza as versões num só sítio. Quando no `build.gradle.kts` escreves
  `libs.appcompat` ou `libs.plugins.android.application`, o Gradle vai buscar aqui o grupo/nome/versão.
- Vantagem: atualizar uma versão faz-se **num único local** e fica consistente. **AGP 8.13.0** é a versão do
  Android Gradle Plugin.
- Repara que **nem todas** as dependências passam pelo catálogo: Retrofit/Glide/etc. estão escritas
  "à mão" no `app/build.gradle.kts` (com a versão inline). Só as androidx/material/test é que estão no
  catálogo. É uma mistura — funciona na mesma.

## 5. `app/src/main/AndroidManifest.xml` — o "bilhete de identidade" da app
```xml
<uses-permission android:name="android.permission.INTERNET" />
<application
    android:icon="@mipmap/ic_launcher" android:label="@string/app_name"
    android:theme="@style/Theme.Lifinity"
    android:usesCleartextTraffic="true">
```
- **`<uses-permission INTERNET>`** — única permissão necessária (a app só precisa de rede para falar com a
  API). **Não** pede permissões perigosas — o *photo picker* do avatar usa `GetContent`, que dispensa
  permissão de armazenamento.
- **`usesCleartextTraffic="true"`** — permite **HTTP simples** (sem HTTPS). É necessário porque a API local
  corre em `http://192.168.x.x:3000` sem certificado. ⚠️ Em produção isto seria HTTPS; aqui é aceitável por
  ser um projeto local/escolar (ponto a referir na defesa).
- **`theme="@style/Theme.Lifinity"`** — o tema claro da marca (ver `res/values/_VALUES.md`).

```xml
<activity android:name=".MainActivity" android:exported="true"
    android:theme="@style/Theme.Lifinity.Splash">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```
- **Cada ecrã (Activity) tem de estar declarado aqui** — senão a app rebenta ao tentar abri-lo. Estão todos
  listados (Achievements, Notifications, Assistant, Chat, Statistics, Inspiration, ...).
- **`MainActivity`** é a **única `exported="true"`** e a única com o `<intent-filter>` MAIN/LAUNCHER → é o
  **ponto de entrada** (o que abre quando se toca no ícone). Usa o tema `Theme.Lifinity.Splash` (ecrã de
  arranque). Todas as outras são `exported="false"` (só a própria app as abre, por segurança).
- **`windowSoftInputMode="adjustResize"`** no Chat e no Assistant — quando o teclado abre, o ecrã
  **encolhe** em vez de tapar o campo de escrita (essencial para o chat).

## Ligações
- O `API_BASE_URL` daqui é lido em [`network/ApiClient.java`](../network/ApiClient.java.md).
- O tema e os recursos visuais: [`res/values/_VALUES.md`](../res/values/_VALUES.md).
- O fluxo de arranque (MainActivity → Landing/Tasks): ver `MainActivity.java`.

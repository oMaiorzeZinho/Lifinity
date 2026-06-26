# `MainActivity.java` — ponto de entrada / "porteiro"

## Papel
É a **primeira Activity** a abrir (é a única com o `<intent-filter>` LAUNCHER no Manifest). **Não tem ecrã
próprio** — só decide para onde mandar o utilizador, conforme tenha ou não sessão iniciada.

## Bloco a bloco
```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    if (TextUtils.isEmpty(getToken())) {
        openLandingActivity();   // sem sessão → boas-vindas
    } else {
        openTasksActivity();     // com sessão → hub de tarefas
    }
}
```
- **`onCreate`** é o método do **ciclo de vida** chamado quando a Activity nasce. Aqui não se faz
  `setContentView` (não há layout) — só a decisão de routing.
- **`getToken()`** lê o token das **`SharedPreferences`** (o "ficheiro" de preferências da app, chave-valor;
  ver abaixo). Se estiver vazio → não há sessão → vai para a **Landing** (ecrã de boas-vindas que leva a
  Login/Registo). Se houver token → vai direto às **Tarefas**.

```java
private String getToken() {
    return getSharedPreferences(PREFS_NAME, MODE_PRIVATE).getString(KEY_TOKEN, null);
}
```
- **`SharedPreferences`** (`"lifinity_prefs"`) é onde a app guarda o **token** e o **user** (em JSON) entre
  sessões. `MODE_PRIVATE` = só esta app lê.

```java
Intent intent = new Intent(this, LandingActivity.class);
intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
startActivity(intent);
finish();
```
- **`Intent`** = a "carta" que diz ao Android "abre este ecrã". `startActivity` abre-o.
- **`FLAG_ACTIVITY_NEW_TASK | CLEAR_TASK`** — **limpa toda a pilha** de ecrãs e começa uma nova. Assim, ao
  carregar em "voltar" no destino, **não** se volta a esta MainActivity (não faria sentido). 
- **`finish()`** fecha esta Activity (já cumpriu o papel de porteiro).

## Ligações
- **Destinos:** `LandingActivity` (sem sessão), `TasksActivity` (com sessão).
- **Quem volta aqui:** o `LoginActivity` abre a `MainActivity` após o login, para o porteiro reencaminhar
  para as Tarefas.
- **Manifest:** é a única `exported="true"` com tema `Theme.Lifinity.Splash` (ecrã de arranque).

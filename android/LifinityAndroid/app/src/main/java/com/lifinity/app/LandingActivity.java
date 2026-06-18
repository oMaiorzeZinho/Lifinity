package com.lifinity.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;

/**
 * Ecrã de boas-vindas público (paridade com a Home.jsx da web).
 * Apresenta a marca e as funcionalidades principais e encaminha o utilizador
 * para o registo ou para o login. Só é mostrado quando NÃO existe sessão
 * (o MainActivity é quem decide: sem token -> Landing; com token -> Tarefas).
 */
public class LandingActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_landing);

        // "Criar conta" (CTA principal, topo e fundo) -> ecrã de registo
        View.OnClickListener openRegister = v ->
                startActivity(new Intent(this, RegisterActivity.class));
        findViewById(R.id.landingRegisterButton).setOnClickListener(openRegister);
        findViewById(R.id.landingRegisterButtonBottom).setOnClickListener(openRegister);

        // "Entrar" / "Já tenho conta" (ação secundária) -> ecrã de login
        View.OnClickListener openLogin = v ->
                startActivity(new Intent(this, LoginActivity.class));
        findViewById(R.id.landingLoginButton).setOnClickListener(openLogin);
        findViewById(R.id.landingLoginButtonBottom).setOnClickListener(openLogin);
    }
}

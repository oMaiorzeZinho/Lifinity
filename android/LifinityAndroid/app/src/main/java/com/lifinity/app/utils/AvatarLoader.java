package com.lifinity.app.utils;

import android.graphics.drawable.Drawable;
import android.text.TextUtils;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.Nullable;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.DataSource;
import com.bumptech.glide.load.engine.GlideException;
import com.bumptech.glide.request.RequestListener;
import com.bumptech.glide.request.target.Target;

import java.util.Locale;

/**
 * Carrega avatares de forma consistente em toda a app.
 *
 * Padrão usado nos layouts: um placeholder (o círculo claro com a inicial, que já
 * existia) com uma {@link ImageView} circular POR CIMA. Este helper decide o que mostrar:
 *  - se houver caminho de avatar  -> carrega a FOTO real com Glide ({@code circleCrop}
 *    para ficar redonda) e torna a ImageView visível (cobre o placeholder);
 *  - se NÃO houver (null/vazio) ou se a foto falhar -> esconde a ImageView e deixa
 *    aparecer o placeholder por baixo (círculo + inicial).
 */
public final class AvatarLoader {

    private AvatarLoader() {
        // Classe utilitária — não se instancia.
    }

    /**
     * @param image       ImageView circular por cima do placeholder (pode ser null).
     * @param avatarPath  caminho do avatar vindo da API (ex.: "/uploads/avatars/x.jpg").
     * @param initialView TextView do placeholder onde se escreve a inicial (opcional).
     * @param username    nome usado para calcular a inicial do placeholder (opcional).
     */
    public static void load(@Nullable ImageView image, @Nullable String avatarPath,
                            @Nullable TextView initialView, @Nullable String username) {
        // Garante a inicial no placeholder (fallback), independentemente da foto.
        if (initialView != null) {
            initialView.setText(initialOf(username));
        }

        if (image == null) {
            return;
        }

        String url = ImageUrlHelper.build(avatarPath);
        if (TextUtils.isEmpty(url)) {
            image.setVisibility(View.GONE);
            return;
        }

        image.setVisibility(View.VISIBLE);
        Glide.with(image.getContext())
                .load(url)
                .circleCrop()
                .listener(new RequestListener<Drawable>() {
                    @Override
                    public boolean onLoadFailed(@Nullable GlideException e, Object model,
                                                Target<Drawable> target, boolean isFirstResource) {
                        // Falhou a carregar a foto: esconde a ImageView para o
                        // placeholder (círculo + inicial) voltar a aparecer.
                        image.setVisibility(View.GONE);
                        return false;
                    }

                    @Override
                    public boolean onResourceReady(Drawable resource, Object model,
                                                   Target<Drawable> target, DataSource dataSource,
                                                   boolean isFirstResource) {
                        return false;
                    }
                })
                .into(image);
    }

    /** Primeira letra do username em maiúscula (ou "?" se vazio). */
    public static String initialOf(String username) {
        if (TextUtils.isEmpty(username)) {
            return "?";
        }
        return username.substring(0, 1).toUpperCase(Locale.getDefault());
    }
}

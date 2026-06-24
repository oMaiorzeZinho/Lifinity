package com.lifinity.app.utils;

import android.text.TextUtils;

import com.lifinity.app.BuildConfig;

/**
 * Constrói o URL completo de uma imagem guardada no backend (ex.: avatares).
 * Replica a lógica do frontend web (frontend/src/utils/imageUrl.js):
 *  - caminho null/vazio  -> devolve null (não há imagem; usa-se o placeholder);
 *  - caminho que já é "http..." -> devolve tal como está;
 *  - caso contrário, pega no endereço base da API SEM o sufixo "/api" e
 *    concatena o caminho (ex.: "/uploads/avatars/x.jpg").
 *
 * Exemplo: API_BASE_URL = "http://192.168.1.200:3000/api/"
 *          path        = "/uploads/avatars/x.jpg"
 *          resultado   = "http://192.168.1.200:3000/uploads/avatars/x.jpg"
 */
public final class ImageUrlHelper {

    private ImageUrlHelper() {
        // Classe utilitária — não se instancia.
    }

    public static String build(String path) {
        if (TextUtils.isEmpty(path)) {
            return null;
        }
        if (path.startsWith("http")) {
            return path;
        }

        // Remove o "/api" ou "/api/" do fim do BASE_URL (igual ao regex /\/api\/?$/ da web).
        String root = BuildConfig.API_BASE_URL.replaceFirst("/api/?$", "");
        // Evita barra dupla entre a raiz e o caminho (o caminho já começa por "/").
        if (root.endsWith("/")) {
            root = root.substring(0, root.length() - 1);
        }
        return root + path;
    }
}

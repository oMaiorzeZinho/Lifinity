package com.lifinity.app.network;

import com.lifinity.app.BuildConfig;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiClient {
    // O URL base vem do build.gradle.kts (buildConfigField API_BASE_URL),
    // para que mudar o IP do servidor seja uma alteracao num unico sitio,
    // sem tocar em codigo Java. Esse IP tem de corresponder ao IP local do PC
    // na rede Wi-Fi (descoberto com "ipconfig"), e o telemovel e o PC tem de
    // estar na MESMA rede Wi-Fi. Para o emulador, usar "http://10.0.2.2:3000/api/".
    private static final String BASE_URL = BuildConfig.API_BASE_URL;
    private static Retrofit retrofit;

    private ApiClient() {
    }

    public static Retrofit getClient() {
        if (retrofit == null) {
            HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
            loggingInterceptor.setLevel(
                    BuildConfig.DEBUG
                            ? HttpLoggingInterceptor.Level.BODY
                            : HttpLoggingInterceptor.Level.NONE
            );

            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(loggingInterceptor)
                    // Timeouts de 30 segundos para evitar falsos negativos
                    // em redes Wi-Fi mais lentas.
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
}

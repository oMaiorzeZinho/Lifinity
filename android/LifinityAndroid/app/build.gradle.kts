plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.lifinity.app"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.lifinity.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // URL base da API. Mudar AQUI o IP sempre que se trocar de rede —
        // tem de corresponder ao IP local do PC na rede Wi-Fi (descoberto com "ipconfig").
        // O telemovel e o PC tem de estar na MESMA rede Wi-Fi.
        // Para o emulador, usar "http://10.0.2.2:3000/api/".
        buildConfigField("String", "API_BASE_URL", "\"http://192.168.11.101:3000/api/\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation(libs.activity.ktx)
    implementation(libs.appcompat)
    implementation(libs.constraintlayout)
    implementation(libs.material)
    implementation("androidx.recyclerview:recyclerview:1.3.2")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    // Glide — carregamento de imagens de avatar (do backend /uploads). Uso simples
    // Glide.with(...).load(...).circleCrop().into(...), sem annotationProcessor.
    implementation("com.github.bumptech.glide:glide:4.16.0")
    // MPAndroidChart — gráficos da página de Estatísticas (vem do JitPack).
    implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")
    testImplementation(libs.junit)
    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(libs.ext.junit)
}

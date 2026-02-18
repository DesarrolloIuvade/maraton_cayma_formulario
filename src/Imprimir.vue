<script setup>
import { ref, onMounted } from 'vue';
import { constancia } from './api.js';

const loading = ref(true);
const error = ref('');
const datos = ref(null);

async function cargarConstancia() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const codigo = pathParts[pathParts.length - 1] || new URLSearchParams(window.location.search).get('codigo');

    if (!codigo) {
        loading.value = false;
        error.value = 'No se proporcionó el código de inscripción.';
        return;
    }

    try {
        const res = await constancia(codigo);
        if (res && res.success && res.data) {
            datos.value = res.data;
        } else {
            error.value = (res && res.message) || 'No se encontró información para el código proporcionado.';
        }
    } catch (e) {
        console.error('Error obteniendo constancia:', e);
        error.value = 'Error de conexión al obtener la constancia. Intente de nuevo.';
    } finally {
        loading.value = false;
    }
}

function imprimir() {
    window.print();
}

onMounted(() => {
    cargarConstancia();
});
</script>

<template>
    <!-- Constancia -->
    <div v-if="datos" class="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 print:bg-white print:py-0">
        <div class="w-full max-w-2xl bg-white shadow-lg print:shadow-none">
            <!-- Línea verde superior -->
            <div class="h-1.5 bg-green-600"></div>

            <div class="px-10 py-8">
                <!-- Municipalidad -->
                <div class="text-center mb-6">
                    <p class="text-xs text-gray-500 uppercase tracking-wider">Municipalidad Distrital de</p>
                    <p class="text-xl font-bold text-gray-900 mt-1">CAYMA</p>
                </div>

                <!-- Título -->
                <div class="text-center mb-6">
                    <p class="text-lg font-bold text-blue-700">Su INSCRIPCIÓN se realizó correctamente</p>
                    <p class="text-sm text-gray-900 mt-1">Bienvenido a la Maratón de la Virgen de la Candelaria 2026.
                    </p>
                </div>

                <!-- Texto informativo -->
                <div class="text-xs text-gray-600 leading-relaxed space-y-2 mb-8">
                    <p>Gracias por INSCRIBIRSE, por favor conserve una copia de esta información como referencia y
                        comprobante de su transacción. Asimismo, sírvase presentar una copia al momento de recoger su
                        kit de corredor del 10, 11, 12, 13 y 14 de Marzo junto con su documento de identidad.</p>
                    <p>Los participantes menores de edad deberán, además, presentar la autorización para menores de edad
                        debidamente firmada y acreditada por su padre y/o tutor y/o representante legal.</p>
                    <p>Se les recuerda que el kit de corredor contiene el polo oficial del evento, el número de
                        competencia y otros materiales publicitarios de los auspiciadores y le es entregado en calidad
                        de cortesía por su inscripción.</p>
                    <p>La organización le desea una buena preparación y éxitos en el evento.</p>
                </div>

                <!-- Maratón 2026 -->
                <div class="border-t border-gray-200 pt-4 mb-5">
                    <p class="text-sm font-bold text-blue-700 mb-3">Maratón 2026</p>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500">Número de corredor</p>
                            <p class="text-sm font-bold text-gray-900">{{ datos.ins_num }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Categoría</p>
                            <p class="text-sm font-bold text-gray-900">{{ datos.cat_nom }}</p>
                        </div>
                    </div>
                </div>

                <!-- Inscripción -->
                <div class="border-t border-gray-200 pt-4 mb-5">
                    <p class="text-sm font-bold text-blue-700 mb-3">Inscripción</p>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500">Código</p>
                            <p class="text-sm font-bold text-gray-900">{{ datos.ins_cod }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Estado</p>
                            <p class="text-sm font-bold text-gray-900">Registrado</p>
                        </div>
                    </div>
                </div>

                <!-- Corredor -->
                <div class="border-t border-gray-200 pt-4 mb-5">
                    <p class="text-sm font-bold text-blue-700 mb-3">Corredor</p>
                    <div class="mb-3">
                        <p class="text-xs text-gray-500">Apellidos y nombres</p>
                        <p class="text-sm font-bold text-gray-900">{{ datos.ins_pat }} {{ datos.ins_mat }} {{
                            datos.ins_nom }}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <p class="text-xs text-gray-500">Documento</p>
                            <p class="text-sm font-bold text-gray-900">{{ datos.ins_t_d }} {{ datos.ins_doc }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Sexo</p>
                            <p class="text-sm font-bold text-gray-900">{{ datos.ins_sex }}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <p class="text-xs text-gray-500">País</p>
                            <p class="text-sm font-bold text-gray-900">{{ datos.pai_nom }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Correo</p>
                            <p class="text-sm font-bold text-gray-900">{{ datos.ins_ema }}</p>
                        </div>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Teléfono</p>
                        <p class="text-sm font-bold text-gray-900">{{ datos.ins_tel }}</p>
                    </div>
                </div>

                <!-- Botones de acción -->
                <div class="flex justify-between items-center mt-6 gap-3 print:hidden">
                    <a href="/" class="text-sm text-green-700 hover:text-green-900 underline">
                        Regresar a la página oficial
                    </a>
                    <button @click="imprimir"
                        class="bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg px-6 py-2.5 transition-colors">
                        Imprimir
                    </button>
                </div>
            </div>

            <!-- Línea verde inferior -->
            <div class="h-1.5 bg-green-600"></div>
        </div>
    </div>

    <!-- Cargando -->
    <div v-else-if="loading" class="min-h-screen flex items-center justify-center bg-white">
        <div class="flex flex-col items-center gap-4 text-center">
            <svg class="size-14 animate-spin text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
            </svg>
            <p class="text-gray-800 font-semibold text-xl">Generando constancia...</p>
            <p class="text-gray-500 text-sm">Espere un momento por favor.</p>
        </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="min-h-screen flex items-center justify-center bg-white p-6">
        <div class="max-w-md w-full bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
            <p class="font-semibold mb-2">No se pudo generar la constancia</p>
            <p class="text-sm">{{ error }}</p>
        </div>
    </div>
</template>

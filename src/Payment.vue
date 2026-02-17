<script setup>
import { ref, onUnmounted } from 'vue';
import { registrarOnline } from './api.js';

const props = defineProps({
    datos: Object
})

const emit = defineEmits(['volver'])
const procesando = ref(false)
const redirigiendo = ref(false)
const errorPago = ref('')

async function pagarConNiubiz() {
    if (procesando.value) return
    procesando.value = true
    errorPago.value = ''

    try {
        const res = await registrarOnline(props.datos)

        if (!res.success || !res.data) {
            errorPago.value = res.message || 'Error al procesar el registro. Intente de nuevo.'
            procesando.value = false
            return
        }

        const niubiz = res.data

        const script = document.createElement('script')
        script.src = niubiz.script
        script.onload = () => {
            VisanetCheckout.configure({
                sessiontoken: niubiz.sessionkey,
                channel: 'web',
                merchantid: niubiz.merchantId,
                purchasenumber: String(niubiz.ide),
                amount: niubiz.amount,
                expirationminutes: '20',
                timeouturl: 'about:blank',
                action: niubiz.url + '?amount=' + niubiz.amount + '&purchaseNumber=' + niubiz.ide,
            })
            // Hasta que se abra el checkout de Niubiz mostramos el loader
            VisanetCheckout.open()
            procesando.value = false
        }
        script.onerror = () => {
            procesando.value = false
            errorPago.value = 'Error al cargar la pasarela de pago. Intente de nuevo.'
        }
        document.head.appendChild(script)
    } catch (e) {
        console.error('Error en pago:', e)
        errorPago.value = 'Error de conexión. Intente de nuevo.'
        procesando.value = false
    }
}
</script>

<template>
    <Teleport to="body">
        <!-- Overlay de carga (abrir pasarela / confirmar pago) -->
        <div v-if="procesando || redirigiendo" class="fixed inset-0 z-9999 bg-white flex items-center justify-center">
            <div class="flex flex-col items-center gap-4 max-w-sm mx-4 text-center">
                <svg class="size-14 animate-spin text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                </svg>
                <p class="text-gray-800 font-semibold text-xl">
                    {{ redirigiendo ? 'Confirmando pago...' : 'Procesando pago...' }}
                </p>
                <p class="text-gray-500 text-sm">
                    {{ redirigiendo
                        ? 'Espere mientras se confirma su transacción. No cierre ni recargue esta ventana.'
                        : 'Espere mientras se carga la pasarela de pago. No cierre esta ventana.'
                    }}
                </p>
            </div>
        </div>

        <!-- Modal de pago -->
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50" @click="!procesando && emit('volver')"></div>

            <div class="relative z-10 w-full max-w-md" :class="{ 'pointer-events-none opacity-60': procesando }">
                <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <!-- Header -->
                    <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div>
                            <p class="font-semibold text-gray-800 text-lg">Pago de Inscripcion</p>
                            <p class="text-gray-400 text-xs">Maraton Internacional de Cayma</p>
                        </div>
                        <button @click="emit('volver')" :disabled="procesando"
                            class="text-gray-400 hover:text-gray-600 text-2xl leading-none disabled:cursor-not-allowed">&times;</button>
                    </div>

                    <div class="p-6 flex flex-col gap-4">
                        <div v-if="datos" class="text-sm text-gray-600 flex flex-col gap-2">
                            <div class="flex justify-between">
                                <span class="text-gray-500">Participante:</span>
                                <span class="font-medium text-gray-800">{{ datos._nombreCompleto }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Categoria:</span>
                                <span class="font-medium text-gray-800">{{ datos._categoriaNombre }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">Documento:</span>
                                <span class="font-medium text-gray-800">{{ datos.ins_t_d }} {{ datos.ins_doc }}</span>
                            </div>
                        </div>

                        <div class="border-t border-gray-200 pt-4 flex justify-between items-center">
                            <span class="text-gray-500 text-sm">Monto a pagar:</span>
                            <span class="text-2xl font-bold text-green-600">S/ {{ datos?._categoriaMonto || '0.00'
                                }}</span>
                        </div>

                        <div v-if="errorPago"
                            class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between">
                            <span>{{ errorPago }}</span>
                            <button @click="errorPago = ''"
                                class="text-red-400 hover:text-red-600 ml-2">&times;</button>
                        </div>

                        <div class="flex flex-col gap-3 mt-2">
                            <button @click="pagarConNiubiz" :disabled="procesando"
                                class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 transition-colors flex items-center justify-center gap-2">
                                <svg v-if="procesando" class="size-5 animate-spin" xmlns="http://www.w3.org/2000/svg"
                                    fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                    </path>
                                </svg>
                                {{ procesando ? 'PROCESANDO...' : 'PAGAR' }}
                            </button>
                            <button :disabled="procesando"
                                class="w-full border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-semibold rounded-lg py-3 transition-colors"
                                @click="emit('volver')">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

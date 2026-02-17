<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import RegistroForm from './Form.vue';
import PagoView from './Payment.vue';
import { registrarEfectivo, confirmarRegistro } from './api.js';

const currentStep = ref('landing')
const codigoAcceso = ref('')
const tieneCodigo = ref(false)
const datosRegistro = ref(null)
const errorMensaje = ref('')
const cargando = ref(false)
const confirmacionHtml = ref('')

const endDate = new Date("2026-03-15T00:00:00")
const meses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];
const texto = `${endDate.getDate()} de ${meses[endDate.getMonth()]} del ${endDate.getFullYear()}`
const dias = ref(0)
const horas = ref(0)
const minutos = ref(0)
const segundos = ref(0)

let interval = null

function actualizarContador() {
  const ahora = new Date();
  const diferencia = endDate - ahora;
  if (diferencia > -1) {
    dias.value = Math.floor(diferencia / (1000 * 60 * 60 * 24))
    horas.value = Math.floor((diferencia / (1000 * 60 * 60)) % 24)
    minutos.value = Math.floor((diferencia / (1000 * 60)) % 60)
    segundos.value = Math.floor((diferencia / 1000) % 60)
  } else {
    dias.value = 0
    horas.value = 0
    minutos.value = 0
    segundos.value = 0
    clearInterval(interval);
  }
}

function ingresarConCodigo() {
  if (!codigoAcceso.value.trim()) return
  tieneCodigo.value = true
  currentStep.value = 'form'
  errorMensaje.value = ''
}

function ingresarSinCodigo() {
  tieneCodigo.value = false
  currentStep.value = 'form'
  errorMensaje.value = ''
}

async function onRegistroCompleto(datos) {
  datosRegistro.value = datos
  errorMensaje.value = ''
  cargando.value = true

  try {
    if (tieneCodigo.value) {
      // Registro con codigo (efectivo)
      const res = await registrarEfectivo(codigoAcceso.value, datos)
      if (res.success) {
        try {
          confirmacionHtml.value = await confirmarRegistro(res.data || {})
        } catch (e) {
          console.error('Error obteniendo confirmación:', e)
        }
        currentStep.value = 'done'
      } else {
        errorMensaje.value = res.message || 'Error al registrar inscripción'
      }
    } else {
      // Registro online: ir a Payment para que el pago se haga al confirmar
      currentStep.value = 'payment'
    }
  } catch (e) {
    console.error('Error en registro:', e)
    errorMensaje.value = 'Error de conexión. Intente de nuevo.'
  } finally {
    cargando.value = false
  }
}

function onCancelar() {
  currentStep.value = 'landing'
  errorMensaje.value = ''
}

function onCerrarPago() {
  currentStep.value = 'form'
}

function onVolverInicio() {
  currentStep.value = 'landing'
  datosRegistro.value = null
  codigoAcceso.value = ''
  tieneCodigo.value = false
  errorMensaje.value = ''
  confirmacionHtml.value = ''
}

onMounted(() => {
  actualizarContador()
  interval = setInterval(actualizarContador, 1000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<template>
  <!-- Nav para el formulario (visible también cuando el modal de pago está abierto) -->
  <nav v-if="currentStep === 'form' || currentStep === 'payment'"
    class="bg-green-600 text-white px-6 py-3 flex items-center gap-3">
    <img src="/images/logo.jpg" alt="Logo" class="w-8 h-8 rounded-full object-cover">
    <span class="font-semibold text-lg">Maratón Internacional de Cayma</span>
  </nav>

  <div class="min-h-screen bg-stone-100 flex items-center justify-center p-4">
    <div v-if="currentStep === 'landing'" class="flex flex-col items-center gap-6 w-full max-w-md">
      <img src="/images/logo.jpg" alt="Maratón Cayma" class="w-32 h-32 rounded-full object-cover shadow-lg">
      <div class="text-center">
        <p class="font-bold text-green-600 text-3xl">Maratón Internacional de Cayma</p>
        <p class="font-light text-green-400 text-2xl mt-1">Virgen de la Candelaria 2026</p>
      </div>

      <div class="bg-white border border-gray-200 p-10 rounded-2xl shadow-2xl w-full flex flex-col items-center gap-6">
        <p class="text-3xl text-gray-500">{{ texto }}</p>

        <div class="flex gap-4 text-center">
          <div class="flex flex-col">
            <span class="text-3xl font-bold text-green-600">{{ dias }}</span>
            <span class="text-xs text-gray-500 uppercase">Días</span>
          </div>
          <span class="text-3xl font-bold text-gray-300">:</span>
          <div class="flex flex-col">
            <span class="text-3xl font-bold text-green-600">{{ horas }}</span>
            <span class="text-xs text-gray-500 uppercase">Horas</span>
          </div>
          <span class="text-3xl font-bold text-gray-300">:</span>
          <div class="flex flex-col">
            <span class="text-3xl font-bold text-green-600">{{ minutos }}</span>
            <span class="text-xs text-gray-500 uppercase">Min</span>
          </div>
          <span class="text-3xl font-bold text-gray-300">:</span>
          <div class="flex flex-col">
            <span class="text-3xl font-bold text-green-600">{{ segundos }}</span>
            <span class="text-xs text-gray-500 uppercase">Seg</span>
          </div>
        </div>

        <div class="w-full flex flex-col gap-3">
          <label for="code" class="text-sm font-medium text-gray-700">Ingrese su código de acceso</label>
          <input v-model="codigoAcceso" placeholder="Código" name="code"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            @keyup.enter="ingresarConCodigo">
          <button
            class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-3 transition-colors"
            @click="ingresarConCodigo">
            CON CÓDIGO
          </button>
          <button
            class="w-full border border-green-600 text-green-600 hover:bg-green-50 font-semibold rounded-lg py-3 transition-colors"
            @click="ingresarSinCodigo">
            SIN CÓDIGO
          </button>
        </div>
      </div>
    </div>

    <!-- Toast de error global fijo -->
    <Transition name="toast">
      <div v-if="errorMensaje" class="fixed top-0 left-0 right-0 z-100 flex justify-center p-4 pointer-events-none">
        <div
          class="pointer-events-auto w-full max-w-2xl bg-red-600 text-white rounded-lg px-5 py-3 shadow-lg flex items-center justify-between gap-3">
          <span class="text-sm font-medium">{{ errorMensaje }}</span>
          <button @click="errorMensaje = ''"
            class="text-white/80 hover:text-white text-xl leading-none shrink-0">&times;</button>
        </div>
      </div>
    </Transition>

    <!-- Formulario con overlay de carga (visible también cuando modal de pago está abierto) -->
    <div v-if="currentStep === 'form' || currentStep === 'payment'" class="relative w-full flex flex-col items-center">
      <!-- Overlay de carga -->
      <div v-if="cargando" class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-2xl">
        <p class="text-green-600 font-semibold text-lg">Procesando inscripción...</p>
      </div>
      <RegistroForm @registrar="onRegistroCompleto" @cancelar="onCancelar" />
    </div>

    <!-- Modal de pago (se renderiza como overlay via Teleport) -->
    <PagoView v-if="currentStep === 'payment'" :datos="datosRegistro" @volver="onCerrarPago" />

    <div v-if="currentStep === 'done'" class="flex flex-col items-center gap-6 w-full max-w-2xl">
      <div v-if="confirmacionHtml" class="w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <iframe :srcdoc="confirmacionHtml" class="w-full border-0" style="min-height: 400px;"
          @load="$event.target.style.height = $event.target.contentDocument.body.scrollHeight + 'px'"></iframe>
      </div>
      <div v-else
        class="bg-white border border-gray-200 p-10 rounded-2xl shadow-2xl w-full flex flex-col items-center gap-4 text-center">
        <p class="text-green-600 text-5xl">&#10003;</p>
        <p class="font-bold text-gray-800 text-xl">Registro exitoso</p>
        <p class="text-gray-500 text-sm">Tu inscripción ha sido completada correctamente.</p>
      </div>
      <button
        class="w-full max-w-md bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-3 transition-colors"
        @click="onVolverInicio">
        Volver al inicio
      </button>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>

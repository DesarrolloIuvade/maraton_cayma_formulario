<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
    pais as fetchPaises,
    departamento as fetchDepartamentos,
    provincia as fetchProvincias,
    distrito as fetchDistritos,
    categoria as fetchCategoria,
    buscarDocumento
} from './api.js';

const emit = defineEmits(['registrar', 'cancelar'])

const tipoDocumento = ref('DNI')
const documento = ref('')
const apellidoPaterno = ref('')
const apellidoMaterno = ref('')
const nombres = ref('')
const genero = ref('')
const fechaNacimiento = ref('')
const tipoSangre = ref('')
const paisOrigen = ref('')
const departamentoSel = ref('')
const provinciaSel = ref('')
const distritoSel = ref('')
const distritoIde = ref('')
const observaciones = ref('')
const direccion = ref('')
const telefono = ref('')
const correo = ref('')
const categoria = ref('')
const categoriaNombre = ref('')
const categoriaMonto = ref('')
const tocados = ref({
    documento: false,
    apellidoPaterno: false,
    apellidoMaterno: false,
    nombres: false,
    genero: false,
    fechaNacimiento: false,
    correo: false,
    categoria: false,
    paisOrigen: false,
})
const contactoEmergencia = ref('')
const telefonoEmergencia = ref('')
const aceptaTerminos = ref(false)
const buscandoDoc = ref(false)
const expDeportiva = ref('')
const errorCorreo = ref('')

const categorias = ref([])
const paises = ref([])
const departamentos = ref([])
const provincias = ref([])
const distritos = ref([])

onMounted(async () => {
    try {
        paises.value = await fetchPaises()
    } catch (e) {
        console.error('Error cargando países:', e)
    }
})

// Busqueda de DNI solo al perder foco
async function buscarDNIBlur() {
    if (tipoDocumento.value !== 'DNI' || documento.value.length !== 8) return
    buscandoDoc.value = true
    try {
        const res = await buscarDocumento(documento.value)
        if (res.success && res.data) {
            apellidoPaterno.value = res.data.per_pat || ''
            apellidoMaterno.value = res.data.per_mat || ''
            nombres.value = res.data.per_nom || ''
            if (res.data.per_sex) {
                genero.value = res.data.per_sex
            }
            if (res.data.per_nac) {
                const parts = res.data.per_nac.split('/')
                if (parts.length === 3) {
                    fechaNacimiento.value = `${parts[2]}-${parts[1]}-${parts[0]}`
                }
            }
        }
    } catch (e) {
        console.error('Error buscando documento:', e)
    } finally {
        buscandoDoc.value = false
    }
}

const esPeru = computed(() => {
    const p = paises.value.find(p => p.pai_ide === paisOrigen.value)
    return p && p.pai_nom && p.pai_nom.toUpperCase().includes('PERU')
})

watch(paisOrigen, async () => {
    departamentoSel.value = ''
    provinciaSel.value = ''
    distritoSel.value = ''
    distritoIde.value = ''
    departamentos.value = []
    provincias.value = []
    distritos.value = []
    if (!paisOrigen.value || !esPeru.value) return
    try {
        departamentos.value = await fetchDepartamentos()
    } catch (e) {
        console.error('Error cargando departamentos:', e)
    }
})

watch(departamentoSel, async (dep) => {
    provinciaSel.value = ''
    distritoSel.value = ''
    distritoIde.value = ''
    provincias.value = []
    distritos.value = []
    if (!dep) return
    try {
        provincias.value = await fetchProvincias(dep)
    } catch (e) {
        console.error('Error cargando provincias:', e)
    }
})

watch(provinciaSel, async (prov) => {
    distritoSel.value = ''
    distritoIde.value = ''
    distritos.value = []
    if (!prov || !departamentoSel.value) return
    try {
        distritos.value = await fetchDistritos(departamentoSel.value, prov)
    } catch (e) {
        console.error('Error cargando distritos:', e)
    }
})

// Buscar categoría con debounce para evitar llamadas excesivas
let categoriaTimeout = null
function buscarCategoriaBlur() {
    if (categoriaTimeout) clearTimeout(categoriaTimeout)
    categoriaTimeout = setTimeout(async () => {
        categoria.value = ''
        categoriaNombre.value = ''
        categoriaMonto.value = ''
        tocados.value.categoria = false
        categorias.value = []
        if (!genero.value || !fechaNacimiento.value) return
        const ano = new Date(fechaNacimiento.value).getFullYear()
        try {
            const res = await fetchCategoria(genero.value, ano)
            categorias.value = res.data || []
            if (categorias.value.length === 1) {
                const cat = categorias.value[0]
                categoria.value = cat.cat_ide || ''
                categoriaNombre.value = cat.cat_nom || ''
                categoriaMonto.value = cat.cat_mon || ''
            }
        } catch (e) {
            console.error('Error cargando categoría:', e)
        }
    }, 500)
}

function onDistritoChange(event) {
    const selectedOption = event.target.selectedOptions[0]
    distritoIde.value = selectedOption ? selectedOption.dataset.ide : ''
}

function soloNumeros(event) {
    const val = event.target.value.replace(/\D/g, '')
    event.target.value = val
    return val
}

function onTelefonoInput(event) {
    telefono.value = soloNumeros(event)
}

function onTelefonoEmergenciaInput(event) {
    telefonoEmergencia.value = soloNumeros(event)
}

function validarCorreo() {
    if (!correo.value) {
        errorCorreo.value = ''
        return
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    errorCorreo.value = regex.test(correo.value) ? '' : 'Ingrese un correo valido (ej: usuario@mail.com)'
}

function onCategoriaChange() {
    const cat = categorias.value.find(c => c.cat_ide === categoria.value)
    if (cat) {
        categoriaNombre.value = cat.cat_nom || ''
        categoriaMonto.value = cat.cat_mon || ''
    } else {
        categoriaNombre.value = ''
        categoriaMonto.value = ''
    }
}

const camposCompletos = computed(() => {
    return !!(
        documento.value &&
        apellidoPaterno.value &&
        apellidoMaterno.value &&
        nombres.value &&
        genero.value &&
        fechaNacimiento.value &&
        correo.value && !errorCorreo.value &&
        categoria.value &&
        paisOrigen.value
    )
})

watch(camposCompletos, (val) => {
    if (!val) aceptaTerminos.value = false
})

function formatDate(dateStr) {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

function registrar() {
    if (!aceptaTerminos.value) return

    const datos = {
        ins_t_d: tipoDocumento.value,
        ins_doc: documento.value,
        ins_pat: apellidoPaterno.value,
        ins_mat: apellidoMaterno.value,
        ins_nom: nombres.value,
        ins_sex: genero.value,
        ins_nac: formatDate(fechaNacimiento.value),
        ins_t_s: tipoSangre.value,
        pai_ide: paisOrigen.value,
        dis_ide: distritoIde.value || '0',
        ins_dir: direccion.value,
        ins_tel: telefono.value,
        ins_ema: correo.value,
        cat_ide: categoria.value,
        ins_con: contactoEmergencia.value,
        ins_t_c: telefonoEmergencia.value,
        ins_obs: observaciones.value,
        ins_exp: expDeportiva.value,
        ins_cod: '000000',
        // Extras para display en UI (prefijo _ para diferenciar)
        _categoriaNombre: categoriaNombre.value,
        _categoriaMonto: categoriaMonto.value,
        _nombreCompleto: `${nombres.value} ${apellidoPaterno.value} ${apellidoMaterno.value}`,
    }
    emit('registrar', datos)
}

function cancelar() {
    emit('cancelar')
}
</script>

<template>
    <div class="w-full max-w-2xl">
        <!-- Card -->
        <div class="bg-white rounded-b-2xl shadow-xl p-8">
            <p class="text-gray-500 text-sm mb-1">Registro de Participante</p>
            <p class="text-gray-600 text-sm mb-1">Para registrar tus datos, por favor rellene los campos de abajo.</p>
            <p class="text-red-500 text-xs mb-6"><span class="font-semibold">*</span> Campos obligatorios</p>
            <form @submit.prevent="registrar" class="flex flex-col gap-4">
                <!-- Documento -->
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo documento</label>
                        <select v-model="tipoDocumento"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="DNI">DNI</option>
                            <option value="CE">CARNET DE EXTRANJERIA</option>
                            <option value="PASAPORTE">PASAPORTE</option>
                        </select>
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nro. documento <span
                                class="text-red-500">*</span></label>
                        <div class="relative">
                            <input v-model="documento" type="text" placeholder="Documento"
                                @blur="buscarDNIBlur(); tocados.documento = true"
                                :class="tocados.documento && !documento ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'"
                                class="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2">
                            <span v-if="buscandoDoc"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Buscando...</span>
                        </div>
                    </div>
                </div>
                <!-- Nombres -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Apellido paterno <span
                                class="text-red-500">*</span></label>
                        <input v-model="apellidoPaterno" type="text" placeholder="Apellido paterno"
                            @blur="tocados.apellidoPaterno = true"
                            :class="tocados.apellidoPaterno && !apellidoPaterno ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'"
                            class="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Apellido materno <span
                                class="text-red-500">*</span></label>
                        <input v-model="apellidoMaterno" type="text" placeholder="Apellido materno"
                            @blur="tocados.apellidoMaterno = true"
                            :class="tocados.apellidoMaterno && !apellidoMaterno ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'"
                            class="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre(s) <span
                            class="text-red-500">*</span></label>
                    <input v-model="nombres" type="text" placeholder="Nombre(s)"
                        @blur="tocados.nombres = true"
                        :class="tocados.nombres && !nombres ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'"
                        class="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2">
                </div>
                <!-- Género -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Género <span
                            class="text-red-500">*</span></label>
                    <div class="flex gap-6" @focusout="tocados.genero = true">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" v-model="genero" value="M" @change="buscarCategoriaBlur"
                                class="accent-green-600 w-4 h-4">
                            <span class="text-sm text-gray-700">Masculino</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" v-model="genero" value="F" @change="buscarCategoriaBlur"
                                class="accent-green-600 w-4 h-4">
                            <span class="text-sm text-gray-700">Femenino</span>
                        </label>
                    </div>
                    <p v-if="tocados.genero && !genero" class="mt-1.5 text-xs text-red-500 font-medium">
                        Seleccione su género para continuar
                    </p>
                </div>
                <!-- Fecha y sangre -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento <span
                                class="text-red-500">*</span></label>
                        <input v-model="fechaNacimiento" type="date"
                            @blur="buscarCategoriaBlur(); tocados.fechaNacimiento = true"
                            :class="tocados.fechaNacimiento && !fechaNacimiento ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'"
                            class="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de sangre</label>
                        <select v-model="tipoSangre"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="">Seleccione</option>
                            <option>O+</option>
                            <option>O-</option>
                            <option>A+</option>
                            <option>A-</option>
                            <option>B+</option>
                            <option>B-</option>
                            <option>AB+</option>
                            <option>AB-</option>
                        </select>
                    </div>
                </div>
                <!-- Categoría -->
                <Transition name="cat-pop">
                    <div v-if="categorias.length"
                        class="rounded-xl border-2 border-green-500 bg-green-50 p-4 shadow-[0_0_0_4px_rgba(22,163,74,0.12)]">
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-sm font-bold text-green-700 uppercase tracking-wide">Categoria <span
                                    class="text-red-500">*</span></label>
                        </div>
                        <select v-model="categoria" @change="onCategoriaChange"
                            @blur="tocados.categoria = true"
                            :class="tocados.categoria && !categoria
                                ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                                : 'border-green-300 focus:ring-green-500 focus:border-green-500'"
                            class="w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white font-medium text-gray-800 transition-colors">
                            <option value="">Seleccione su categoria</option>
                            <option v-for="c in categorias" :key="c.cat_ide" :value="c.cat_ide">
                                {{ c.cat_nom }}
                            </option>
                        </select>
                        <p v-if="tocados.categoria && !categoria"
                            class="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                            <svg class="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                            </svg>
                            Seleccione una categoría para continuar
                        </p>
                        <p v-if="categoriaNombre"
                            class="mt-2 text-xs text-green-700 font-semibold flex items-center gap-1">
                            <svg class="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd"
                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                    clip-rule="evenodd" />
                            </svg>
                            {{ categoriaNombre }}
                        </p>
                    </div>
                </Transition>

                <!-- Experiencia deportiva -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Experiencia Deportiva</label>
                    <textarea v-model="expDeportiva" placeholder="Experiencia Deportiva" rows="2"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
                </div>

                <!-- País de origen -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">País de origen <span
                            class="text-red-500">*</span></label>
                    <select v-model="paisOrigen"
                        @blur="tocados.paisOrigen = true"
                        :class="tocados.paisOrigen && !paisOrigen ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'"
                        class="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2">
                        <option value="">Seleccione</option>
                        <option v-for="p in paises" :key="p.pai_ide" :value="p.pai_ide">{{ p.pai_nom }}</option>
                    </select>
                </div>
                <!-- Departamento / Provincia / Distrito -->
                <Transition name="slide">
                    <div v-if="esPeru" class="grid grid-cols-3 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                            <select v-model="departamentoSel"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                                <option value="">Seleccione</option>
                                <option v-for="d in departamentos" :key="d.ubi_ide" :value="d.ubi_dep">{{ d.ubi_dep
                                    }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                            <select v-model="provinciaSel" :disabled="!departamentoSel"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100">
                                <option value="">Seleccione</option>
                                <option v-for="p in provincias" :key="p.ubi_ide" :value="p.ubi_pro">{{ p.ubi_pro
                                    }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
                            <select v-model="distritoSel" :disabled="!provinciaSel" @change="onDistritoChange"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100">
                                <option value="">Seleccione</option>
                                <option v-for="d in distritos" :key="d.ubi_ide" :value="d.ubi_dis"
                                    :data-ide="d.ubi_ide">{{ d.ubi_dis
                                    }}</option>
                            </select>
                        </div>
                    </div>
                </Transition>
                <!-- Contacto -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <input v-model="direccion" type="text" placeholder="Dirección"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input v-model="telefono" type="tel" inputmode="numeric" placeholder="Teléfono"
                            @input="onTelefonoInput"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico <span
                            class="text-red-500">*</span></label>
                    <input v-model="correo" type="email" placeholder="correo@ejemplo.com"
                        @blur="validarCorreo(); tocados.correo = true"
                        @input="errorCorreo = ''"
                        :class="(tocados.correo && !correo) || errorCorreo ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'"
                        class="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2">
                    <span v-if="errorCorreo"
                        class="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">{{
                            errorCorreo }}</span>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <textarea v-model="observaciones" placeholder="Observaciones (opcional)" rows="2"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
                </div>
                <!-- Emergencia -->
                <div class="border-t border-gray-200 pt-4 mt-2">
                    <p class="text-sm font-semibold text-gray-700 mb-3">Contacto de emergencia</p>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                            <input v-model="contactoEmergencia" type="text" placeholder="Nombre del contacto"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input v-model="telefonoEmergencia" type="tel" inputmode="numeric"
                                placeholder="Teléfono de emergencia" @input="onTelefonoEmergenciaInput"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                        </div>
                    </div>
                </div>
                <!-- Términos -->
                <label class="flex items-start gap-2 mt-2"
                    :class="camposCompletos ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'">
                    <input type="checkbox" v-model="aceptaTerminos" :disabled="!camposCompletos"
                        class="accent-green-600 w-4 h-4 mt-0.5">
                    <span class="text-sm text-gray-600">Acepto los términos y condiciones</span>
                </label>
                <!-- Botones -->
                <div class="flex gap-3 mt-4">
                    <button type="submit" :disabled="!camposCompletos || !aceptaTerminos"
                        class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 transition-colors">
                        REGISTRARME
                    </button>
                    <button type="button"
                        class="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg py-3 transition-colors"
                        @click="cancelar">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.cat-pop-enter-active {
    animation:
        cat-pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
        cat-shake 0.45s ease 0.38s;
}

.cat-pop-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.97);
}

@keyframes cat-pop-in {
    from {
        opacity: 0;
        transform: translateY(-10px) scale(0.97);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes cat-shake {

    0%,
    100% {
        transform: translateX(0);
    }

    20% {
        transform: translateX(-6px);
    }

    40% {
        transform: translateX(6px);
    }

    60% {
        transform: translateX(-4px);
    }

    80% {
        transform: translateX(4px);
    }
}

.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
    margin-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
    opacity: 1;
    max-height: 200px;
}
</style>

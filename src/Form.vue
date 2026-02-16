<script setup>
import { ref, watch, onMounted } from 'vue';
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

// Busqueda automatica de DNI
watch([documento, tipoDocumento], async ([doc, tipo]) => {
    if (tipo !== 'DNI' || doc.length !== 8) return
    buscandoDoc.value = true
    try {
        const res = await buscarDocumento(doc)
        if (res.success && res.data) {
            apellidoPaterno.value = res.data.per_pat || ''
            apellidoMaterno.value = res.data.per_mat || ''
            nombres.value = res.data.per_nom || ''
            if (res.data.per_sex) {
                genero.value = res.data.per_sex
            }
            if (res.data.per_nac) {
                // Convertir de DD/MM/YYYY a YYYY-MM-DD para input date
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
})

watch(paisOrigen, async () => {
    departamentoSel.value = ''
    provinciaSel.value = ''
    distritoSel.value = ''
    distritoIde.value = ''
    departamentos.value = []
    provincias.value = []
    distritos.value = []
    if (!paisOrigen.value) return
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

watch([genero, fechaNacimiento], async ([sex, fecha]) => {
    categoria.value = ''
    categoriaNombre.value = ''
    categoriaMonto.value = ''
    categorias.value = []
    if (!sex || !fecha) return
    const ano = new Date(fecha).getFullYear()
    try {
        const res = await fetchCategoria(sex, ano)
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
})

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
        <img src="/images/banner.jpg" alt="Banner Maratón" class="w-full h-48 object-cover rounded">
        <!-- Card -->
        <div class="bg-white rounded-b-2xl shadow-xl p-8">
            <p class="text-gray-500 text-sm mb-1">Registro de Participante</p>
            <p class="text-gray-600 text-sm mb-6">Para registrar tus datos, por favor rellene los campos de abajo.</p>
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nro. documento</label>
                        <div class="relative">
                            <input v-model="documento" type="text" placeholder="Documento"
                                class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                            <span v-if="buscandoDoc"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Buscando...</span>
                        </div>
                    </div>
                </div>
                <!-- Nombres -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Apellido paterno</label>
                        <input v-model="apellidoPaterno" type="text" placeholder="Apellido paterno"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Apellido materno</label>
                        <input v-model="apellidoMaterno" type="text" placeholder="Apellido materno"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre(s)</label>
                    <input v-model="nombres" type="text" placeholder="Nombre(s)"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
                <!-- Género -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Género</label>
                    <div class="flex gap-6">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" v-model="genero" value="M" class="accent-green-600 w-4 h-4">
                            <span class="text-sm text-gray-700">Masculino</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" v-model="genero" value="F" class="accent-green-600 w-4 h-4">
                            <span class="text-sm text-gray-700">Femenino</span>
                        </label>
                    </div>
                </div>
                <!-- Fecha y sangre -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                        <input v-model="fechaNacimiento" type="date"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
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
                <div v-if="categorias.length">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select v-model="categoria" @change="onCategoriaChange"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Seleccione categoria</option>
                        <option v-for="c in categorias" :key="c.cat_ide" :value="c.cat_ide">
                            {{ c.cat_nom }} (S/ {{ c.cat_mon }})
                        </option>
                    </select>
                </div>

                <!-- Experiencia deportiva -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Experiencia Deportiva</label>
                    <textarea v-model="expDeportiva" placeholder="Experiencia Deportiva" rows="2"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
                </div>

                <!-- País de origen -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">País de origen</label>
                    <select v-model="paisOrigen"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Seleccione</option>
                        <option v-for="p in paises" :key="p.pai_ide" :value="p.pai_ide">{{ p.pai_nom }}</option>
                    </select>
                </div>
                <!-- Departamento / Provincia / Distrito -->
                <Transition name="slide">
                    <div v-if="paisOrigen" class="grid grid-cols-3 gap-3">
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
                    <label class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                    <input v-model="correo" type="email" placeholder="correo@ejemplo.com" @blur="validarCorreo"
                        @input="errorCorreo = ''"
                        :class="errorCorreo ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'"
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
                <label class="flex items-start gap-2 cursor-pointer mt-2">
                    <input type="checkbox" v-model="aceptaTerminos" class="accent-green-600 w-4 h-4 mt-0.5">
                    <span class="text-sm text-gray-600">Acepto los términos y condiciones</span>
                </label>
                <!-- Botones -->
                <div class="flex gap-3 mt-4">
                    <button type="submit" :disabled="!aceptaTerminos"
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

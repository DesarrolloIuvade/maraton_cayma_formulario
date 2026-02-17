<script setup>
import { ref, onMounted } from 'vue';
import { constancia } from './api.js';
import jsPDF from 'jspdf';

const loading = ref(true);
const error = ref('');
const pdfUrl = ref('');
async function cargarConstancia() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('codigo');

    if (!codigo) {
        loading.value = false;
        error.value = 'No se proporcionó el código de inscripción.';
        return;
    }

    try {
        const res = await constancia(codigo);
        if (res && res.success && res.data) {
            generarPDF(res.data);
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

function generarPDF(d) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth(); // 210
    const margin = 25;
    const contentW = w - margin * 2;
    let y = 0;

    // Colores
    const green = [22, 163, 74];       // #16a34a
    const blue = [29, 78, 216];        // #1d4ed8
    const dark = [17, 24, 39];         // #111827
    const gray = [107, 114, 128];      // #6b7280
    const grayLight = [229, 231, 235]; // #e5e7eb
    const textGray = [75, 85, 99];     // #4b5563

    // --- Línea verde superior ---
    pdf.setFillColor(...green);
    pdf.rect(0, 0, w, 4, 'F');
    y = 20;

    // --- Municipalidad ---
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...gray);
    pdf.text('MUNICIPALIDAD DISTRITAL DE', w / 2, y, { align: 'center' });
    y += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(...dark);
    pdf.text('CAYMA', w / 2, y, { align: 'center' });
    y += 12;

    // --- Título inscripción ---
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(...blue);
    pdf.text('Su INSCRIPCIÓN se realizó correctamente', w / 2, y, { align: 'center' });
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...dark);
    pdf.text('Bienvenido a la Maratón de la Virgen de la Candelaria 2026.', w / 2, y, { align: 'center' });
    y += 10;

    // --- Texto informativo ---
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...textGray);

    const textoInfo = [
        'Gracias por INSCRIBIRSE, por favor conserve una copia de esta información como referencia y comprobante de su transacción. Asimismo, sírvase presentar una copia al momento de recoger su kit de corredor del 15 al 16 de febrero, junto con su documento de identidad.',
        '',
        'Los participantes menores de edad deberán, además, presentar la autorización para menores de edad debidamente firmada y acreditada por su padre y/o tutor y/o representante legal.',
        '',
        'Se les recuerda que el kit de corredor contiene el polo oficial del evento, el número de competencia y otros materiales publicitarios de los auspiciadores y le es entregado en calidad de cortesía por su inscripción.',
        '',
        'La organización le desea una buena preparación y éxitos en el evento.',
    ];

    for (const parrafo of textoInfo) {
        if (parrafo === '') {
            y += 3;
            continue;
        }
        const lines = pdf.splitTextToSize(parrafo, contentW);
        for (let i = 0; i < lines.length; i++) {
            const isLast = i === lines.length - 1;
            pdf.text(lines[i], margin, y, {
                align: 'justify',
                maxWidth: isLast ? undefined : contentW,
            });
            y += 3.5;
        }
    }
    y += 6;

    // --- Helper para secciones ---
    function lineaSeparadora() {
        pdf.setDrawColor(...grayLight);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, w - margin, y);
        y += 6;
    }

    function tituloSeccion(texto) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...blue);
        pdf.text(texto, margin, y);
        y += 7;
    }

    function campo(label, valor, x, ancho) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...gray);
        pdf.text(label, x, y);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(...dark);
        const lines = pdf.splitTextToSize(String(valor || ''), ancho);
        pdf.text(lines, x, y + 4);
        return 4 + lines.length * 4;
    }

    const colW = contentW / 2;
    const col1 = margin;
    const col2 = margin + colW;

    // --- Maratón 2026 ---
    lineaSeparadora();
    tituloSeccion('Maratón 2026');
    const h1 = campo('Número de corredor', d.ins_num, col1, colW - 5);
    const h2 = campo('Categoría', d.cat_nom, col2, colW - 5);
    y += Math.max(h1, h2) + 4;

    // --- Inscripción ---
    lineaSeparadora();
    tituloSeccion('Inscripción');
    const h3 = campo('Código', d.ins_cod, col1, colW - 5);
    const h4 = campo('Estado', 'Registrado', col2, colW - 5);
    y += Math.max(h3, h4) + 4;

    // --- Corredor ---
    lineaSeparadora();
    tituloSeccion('Corredor');

    // Nombre completo (ancho completo)
    const nombreCompleto = `${d.ins_pat} ${d.ins_mat} ${d.ins_nom}`;
    const hNom = campo('Apellidos y nombres', nombreCompleto, col1, contentW);
    y += hNom + 4;

    const h5 = campo('Documento', `${d.ins_t_d} ${d.ins_doc}`, col1, colW - 5);
    const h6 = campo('Sexo', d.ins_sex, col2, colW - 5);
    y += Math.max(h5, h6) + 4;

    const h7 = campo('País', d.pai_nom, col1, colW - 5);
    const h8 = campo('Correo', d.ins_ema, col2, colW - 5);
    y += Math.max(h7, h8) + 4;

    const h9 = campo('Teléfono', d.ins_tel, col1, colW - 5);
    y += h9 + 10;

    // --- Botón Imprimir dentro del PDF ---
    const btnW = 40;
    const btnH = 10;
    const btnX = w - margin - btnW;
    const btnY = y;
    pdf.setFillColor(...green);
    pdf.roundedRect(btnX, btnY, btnW, btnH, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Imprimir', btnX + btnW / 2, btnY + btnH / 2 + 1, { align: 'center' });

    // Añadir acción JavaScript al área del botón
    pdf.link(btnX, btnY, btnW, btnH, { url: 'javascript:window.print()' });

    // --- Línea verde inferior ---
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(...green);
    pdf.rect(0, pageH - 4, w, 4, 'F');

    // Generar blob y mostrar
    const blob = pdf.output('blob');
    pdfUrl.value = URL.createObjectURL(blob);
}

onMounted(() => {
    cargarConstancia();
});
</script>

<template>
    <!-- Visor PDF a pantalla completa -->
    <div v-if="pdfUrl" class="w-screen h-screen">
        <iframe :src="pdfUrl" class="w-full h-full border-0" type="application/pdf"></iframe>
    </div>

    <!-- Cargando -->
    <div v-else-if="loading" class="min-h-screen flex items-center justify-center bg-white">
        <div class="text-center">
            <p class="text-lg font-semibold text-green-600">Generando constancia PDF...</p>
            <p class="text-sm text-gray-500 mt-1">Espere un momento por favor.</p>
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

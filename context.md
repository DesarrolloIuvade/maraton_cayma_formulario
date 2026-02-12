endpoint original

## ENDPOINTS PUBLICOS (sin autenticacion)

### 1. Buscar Documento de Identidad

Busca datos de una persona por su DNI (8 digitos) en el padron.

| Campo   | Valor                     |
| ------- | ------------------------- |
| **tgs** | `maraton_buscardocumento` |

**Params:**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| doc | string(8) | Si | Numero de DNI, debe ser exactamente 8 digitos |

**Response exitoso:**

```json
{
  "success": true,
  "data": {
    "per_pat": "APELLIDO_PATERNO",
    "per_mat": "APELLIDO_MATERNO",
    "per_nom": "NOMBRES",
    "per_nac": "FECHA_NACIMIENTO",
    "per_sex": "M|F"
  }
}
```

---

### 2. Listar Paises

Retorna la lista de paises disponibles.

| Campo   | Valor            |
| ------- | ---------------- |
| **tgs** | `maraton_paises` |

**Params:** Ninguno requerido.

**Response:**

```json
{
  "data": [{ "pai_ide": "4", "pai_nom": "PERU", "pai_cod": "PE" }]
}
```

---

### 3. Listar Departamentos

Retorna departamentos del Peru.

| Campo   | Valor                  |
| ------- | ---------------------- |
| **tgs** | `maraton_departamento` |

**Params:** Ninguno requerido.

**Response:**

```json
{
  "data": [{ "ubi_ide": "1", "ubi_dep": "AREQUIPA" }]
}
```

---

### 4. Listar Provincias

Retorna provincias filtradas por departamento.

| Campo   | Valor               |
| ------- | ------------------- |
| **tgs** | `maraton_provincia` |

**Params:**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| d | string | Si | Nombre del departamento (ej: "AREQUIPA") |

**Response:**

```json
{
  "data": [{ "ubi_ide": "10", "ubi_pro": "AREQUIPA" }]
}
```

---

### 5. Listar Distritos

Retorna distritos filtrados por departamento y provincia.

| Campo   | Valor              |
| ------- | ------------------ |
| **tgs** | `maraton_distrito` |

**Params:**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| d | string | Si | Nombre del departamento |
| p | string | Si | Nombre de la provincia |

**Response:**

```json
{
  "data": [{ "ubi_ide": "22", "ubi_dis": "CAYMA" }]
}
```

---

### 6. Listar Categorias (filtradas por sexo y edad)

Retorna categorias disponibles para inscripcion, filtradas por sexo y ano de nacimiento.

| Campo   | Valor               |
| ------- | ------------------- |
| **tgs** | `maraton_categoria` |

**Params:**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| sex | string | Si | Sexo del corredor: "M" o "F" |
| ano | string | Si | Ano de nacimiento (ej: "1986"). Se filtra que este entre `ano_des` y `ano_has` |

**Response:**

```json
{
  "data": [
    {
      "cat_ide": "2",
      "cat_nom": "10K VARONES",
      "cat_vac": 150,
      "cat_mon": "50.00"
    }
  ]
}
```

> Si `cat_vac <= 0` el nombre aparece con " (sin vacantes)" concatenado.

---

### 7. Categorias Disponibles (vista general)

Retorna todas las categorias con su estado de disponibilidad.

| Campo   | Valor                         |
| ------- | ----------------------------- |
| **tgs** | `maraton_categoriadisponible` |

**Params:** Ninguno.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "cat_ide": "2",
      "cat_nom": "10K VARONES",
      "cat_vac": 150,
      "cat_mon": "50.00",
      "cat_dis": "1",
      "cat_col": "b73a3a",
      "cat_msg": "4.5K VARONES (AGOTADO)"
    }
  ]
}
```

> Solo retorna categorias donde `cat_dis != 1` (agotadas). Las disponibles no aparecen en esta lista. `cat_col` es un color hex para mostrar visualmente y `cat_msg` el texto con "(AGOTADO)".

---

### 8. Registrar Inscripcion Online (con pago Niubiz)

Registra un inscrito en estado pre-inscripcion (est_ado=1) y genera sesion de pago Niubiz.

| Campo   | Valor                     |
| ------- | ------------------------- |
| **tgs** | `maraton_registraronline` |

**Params:**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| codigo | string | Si | Codigo de maraton (ej: "111111"). Actualmente no se usa en el flujo online |
| values | JSON string | Si | Objeto JSON stringificado con los datos del inscrito |

**Estructura de `values` (JSON string):**

```json
{
  "ins_t_d": "DNI",
  "ins_doc": "44024637",
  "ins_pat": "APELLIDO_PATERNO",
  "ins_mat": "APELLIDO_MATERNO",
  "ins_nom": "NOMBRES",
  "ins_sex": "M",
  "ins_nac": "21/11/1986",
  "ins_t_s": "O+",
  "pai_ide": "4",
  "dis_ide": "22",
  "ins_dir": "Direccion del corredor",
  "ins_tel": "958335798",
  "ins_ema": "correo@email.com",
  "cat_ide": "2",
  "ins_con": "Nombre contacto emergencia",
  "ins_t_c": "Telefono contacto emergencia",
  "ins_cod": "000000"
}
```

**Detalle de cada campo de `values`:**
| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| ins_t_d | string | Si | Tipo documento: "DNI", "CE", "PASAPORTE" |
| ins_doc | string | Si | Numero de documento. Si esta vacio retorna error |
| ins_pat | string | Si | Apellido paterno |
| ins_mat | string | Si | Apellido materno |
| ins_nom | string | Si | Nombres |
| ins_sex | string | Si | Sexo: "M" o "F" |
| ins_nac | string | Si | Fecha nacimiento formato "DD/MM/YYYY" |
| ins_t_s | string | Si | Tipo de sangre: "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-" |
| pai_ide | string | Si | ID del pais (de endpoint maraton_paises) |
| dis_ide | string | No | ID del distrito (de endpoint maraton_distrito). Default "0" |
| ins_dir | string | Si | Direccion |
| ins_tel | string | Si | Telefono |
| ins_ema | string | Si | Correo electronico |
| cat_ide | string | Si | ID de categoria (de endpoint maraton_categoria) |
| ins_con | string | Si | Nombre del contacto de emergencia |
| ins_t_c | string | Si | Telefono del contacto de emergencia |
| ins_cod | string | No | Codigo de pago. En flujo online se ignora, se guarda vacio |

**Response exitoso:**

```json
{
  "success": true,
  "data": {
    "ide": 123,
    "sessionkey": "SESSION_KEY_NIUBIZ",
    "merchantId": "MERCHANT_ID",
    "amount": "50.00",
    "script": "https://static-content.vnforapps.com/v2/js/checkout.js",
    "action": "confirmacion",
    "url": "URL_TRANSACCION_NIUBIZ"
  }
}
```

**Posibles errores:**

```json
{ "success": false, "message": "ingrese documento de identidad para la inscripcion" }
{ "success": false, "message": "Competidor ya se encuentra registrado, comuniquese con el oficina de inscripciones" }
{ "success": false, "message": "No hay monto por la categoria" }
```

**Flujo del frontend despues del response exitoso:**

1. Cargar el script de Niubiz desde `data.script`
2. Configurar el checkout de Niubiz con `sessionkey`, `merchantId`, `amount`
3. El `purchaseNumber` es `data.ide`
4. Al completar el pago, Niubiz redirige/hace callback al endpoint `maraton_confirmarregistro`

---

### 9. Confirmar Pago Online (callback de Niubiz)

Este endpoint es llamado por Niubiz despues del pago. NO lo llama el frontend directamente. Niubiz hace POST con `transactionToken` y `purchaseNumber` via GET.

| Campo   | Valor                       |
| ------- | --------------------------- |
| **tgs** | `maraton_confirmarregistro` |

**Params (enviados por Niubiz):**
| Param | Tipo | Origen | Descripcion |
|-------|------|--------|-------------|
| purchaseNumber | string | GET | Numero de pedido (el `ide` del paso anterior) |
| transactionToken | string | POST | Token de transaccion de Niubiz |
| customerEmail | string | POST | Email del cliente |

**Response:** Retorna HTML directamente (no JSON). Muestra pagina de confirmacion con:

- Numero de pedido
- Fecha y hora
- Tarjeta usada
- Importe pagado
- Codigo de pago del corredor
- Numero de corredor

Si el pago es exitoso muestra pagina verde de exito. Si falla muestra pagina roja con los datos del error.

---

### 10. Registrar Inscripcion en Efectivo

Registra un inscrito con un codigo pre-generado (pago en efectivo). El codigo se valida contra la tabla `maraton.codigo`.

| Campo   | Valor                       |
| ------- | --------------------------- |
| **tgs** | `maraton_registrarefectivo` |

**Params:**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| codigo | string | Si | Codigo de pago pre-generado (se valida en BD) |
| values | JSON string | Si | Misma estructura que `maraton_registraronline` |

**Estructura de `values`:** Identica a `maraton_registraronline`, con campo adicional:
| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| ins_obs | string | Si | Observaciones |

> La diferencia es que aqui `ins_cod` se guarda con el valor del param `codigo` y `est_ado` se pone en `2` (confirmado directo).

**Posibles errores:**

```json
{ "success": false, "message": "ingrese el codigo de inscripcion" }
{ "success": false, "message": "Codigo se encuentra anulado" }
{ "success": false, "message": "Codigo ya fue registrado por: APELLIDO MATERNO NOMBRE" }
{ "success": false, "message": "Codigo XXXXXX no existe, revise el codigo e intente de nuevo" }
{ "success": false, "message": "Competidor ya se encuentra registrado, comuniquese con el oficina de inscripciones" }
```

**Response exitoso:**

```json
{ "success": true, "message": "Se registro competidor satisfactoriamente" }
```

---

### 11. Consultar Constancia

Busca la constancia de inscripcion por codigo de pago.

| Campo   | Valor                |
| ------- | -------------------- |
| **tgs** | `maraton_constancia` |

**Params:**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| codigo | string | Si | Codigo de pago del inscrito (ins_cod) |

**Response exitoso:**

```json
{
  "success": true,
  "data": {
    "ins_ide": 1,
    "ins_t_d": "DNI",
    "ins_doc": "44024637",
    "ins_pat": "APELLIDO_PATERNO",
    "ins_mat": "APELLIDO_MATERNO",
    "ins_nom": "NOMBRES",
    "ins_sex": "M",
    "ins_nac": "21/11/1986",
    "ins_t_s": "O+",
    "ins_dir": "Direccion",
    "ins_tel": "958335798",
    "ins_ema": "correo@email.com",
    "ins_con": "Contacto",
    "ins_t_c": "Tel contacto",
    "ins_cod": "ABC123",
    "ins_num": "101",
    "cat_nom": "10K VARONES",
    "pai_nom": "PERU",
    "ubi_dep": "AREQUIPA",
    "ubi_pro": "AREQUIPA",
    "ubi_dis": "CAYMA",
    "est_ado": "2"
  }
}
```

**Error:**

```json
{ "success": false, "message": "no existe constancia", "data": [] }
```

> Solo retorna inscritos con `est_ado IN (2, 3)` (pagado/confirmado).

---

## FLUJO DE PAGO ONLINE CON NIUBIZ

```
1. Frontend carga datos auxiliares:
   - GET paises      -> maraton_paises
   - GET categorias  -> maraton_categoria (filtrar por sexo y ano)
   - GET ubigeo      -> maraton_departamento / maraton_provincia / maraton_distrito
   - Buscar DNI      -> maraton_buscardocumento (autocompleta nombres)

2. Usuario llena formulario y envia:
   -> maraton_registraronline
   <- Recibe: sessionkey, merchantId, amount, script, ide, action, url

3. Frontend abre checkout Niubiz:
   - Carga script JS de Niubiz (data.script)
   - Configura con sessionkey, merchantId, amount
   - purchaseNumber = data.ide
   - action = data.url (URL de transaccion)

4. Usuario paga en widget Niubiz

5. Niubiz redirige a la URL de confirmacion:
   -> maraton_confirmarregistro (con purchaseNumber y transactionToken)
   <- Retorna HTML con resultado del pago
   <- Si exito: envia email al corredor con link de constancia
```

## ESTRUCTURA DE DATOS - TABLA maraton.inscrito

| Campo   | Tipo      | Descripcion                                                  |
| ------- | --------- | ------------------------------------------------------------ |
| ins_ide | serial PK | ID autoincremental                                           |
| ins_t_d | varchar   | Tipo documento (DNI, CE, PASAPORTE)                          |
| ins_doc | varchar   | Numero de documento                                          |
| ins_pat | varchar   | Apellido paterno                                             |
| ins_mat | varchar   | Apellido materno                                             |
| ins_nom | varchar   | Nombres                                                      |
| ins_sex | varchar   | Sexo (M/F)                                                   |
| ins_nac | varchar   | Fecha nacimiento                                             |
| ins_t_s | varchar   | Tipo de sangre                                               |
| pai_ide | int FK    | ID pais                                                      |
| dis_ide | int FK    | ID distrito (ubigeo)                                         |
| ins_obs | varchar   | Observaciones                                                |
| ins_dir | varchar   | Direccion                                                    |
| ins_tel | varchar   | Telefono                                                     |
| ins_ema | varchar   | Correo electronico                                           |
| cat_ide | int FK    | ID categoria                                                 |
| ins_con | varchar   | Contacto emergencia nombre                                   |
| ins_t_c | varchar   | Contacto emergencia telefono                                 |
| ins_cod | varchar   | Codigo de pago (vacio en online, generado en efectivo)       |
| ins_num | varchar   | Numero de corredor                                           |
| est_ado | int       | Estado: 0=anulado, 1=pre-inscripcion, 2=pagado, 3=confirmado |

## ESTRUCTURA DE DATOS - TABLA maraton.categoria

| Campo   | Tipo      | Descripcion                 |
| ------- | --------- | --------------------------- |
| cat_ide | serial PK | ID categoria                |
| cat_nom | varchar   | Nombre (ej: "10K VARONES")  |
| cat_ini | int       | Edad minima                 |
| cat_fin | int       | Edad maxima                 |
| ano_des | int       | Ano nacimiento desde        |
| ano_has | int       | Ano nacimiento hasta        |
| cat_sex | varchar   | Sexo permitido (M/F/ambos)  |
| cat_ins | int       | Cantidad inscritos          |
| cat_vac | int       | Vacantes disponibles        |
| cat_mon | numeric   | Monto a pagar               |
| cat_dis | int       | Disponible: 1=si, 0=agotado |
| cat_num | int       | Numero de dorsal            |

## ESTRUCTURA DE DATOS - TABLA maraton.codigo

| Campo   | Tipo      | Descripcion                              |
| ------- | --------- | ---------------------------------------- |
| cod_ide | serial PK | ID codigo                                |
| cod_cod | varchar   | Codigo alfanumerico                      |
| est_ado | int       | Estado: 0=anulado, 1=disponible, 2=usado |

## NOTAS IMPORTANTES

1. **ins_cod en pago online**: Al registrar online, `ins_cod` se guarda vacio. Actualmente falta logica para asignarlo despues del pago exitoso.
2. **Validacion de duplicados**: Se valida por `ins_t_d` + `ins_doc` con `est_ado=2`. Si ya existe un inscrito pagado con ese documento, no permite registrar de nuevo.
3. **Niubiz (ex VisaNet)**: El sistema usa la pasarela de pagos Niubiz. Las credenciales y URLs se configuran en la tabla `siggo.vw_pasarela` con codigos: `VISANET_URL_SESSION`, `VISANET_MERCHANT_ID`, `VISANET_SCRIPT`, `VISANET_URL_TRANSACCION`, `VISANET_URL_AUTHORIZATION`, `VISANET_URL_SECURITY`, `VISANET_USER`, `VISANET_PASSWORD`.
4. **Email post-pago**: Tras pago exitoso se envia email con PHPMailer con link a `https://maraton2025.municayma.gob.pe/imprimir/{ins_cod}` para ver la constancia.

// Comprobaciones y recuento para las pruebas, sin depender de ningún framework.

let failures = 0;
let checks = 0;

// Espera que una escritura o lectura sea permitida (o rechazada) por las reglas de Firestore.
async function expectRule(label, shouldSucceed, fn) {
  checks++;
  try {
    await fn();
    if (!shouldSucceed) {
      failures++;
    }
    console.log(`${shouldSucceed ? '  ok  ' : ' FALLA'} ${label} -> permitido`);
  } catch (error) {
    const denied = error.code === 'permission-denied';
    const ok = !shouldSucceed && denied;
    if (!ok) {
      failures++;
    }
    console.log(`${ok ? '  ok  ' : ' FALLA'} ${label} -> ${error.code || error.message}`);
  }
}

// Comprobación normal (E2E): `actual` debe ser igual a `expected`.
function expectEqual(label, actual, expected) {
  checks++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
  }
  console.log(`${ok ? '  ok  ' : ' FALLA'} ${label}${ok ? '' : ` -> esperaba ${JSON.stringify(expected)}, llegó ${JSON.stringify(actual)}`}`);
}

function expectTrue(label, value) {
  expectEqual(label, value === true, true);
}

function title(text) {
  console.log(`\n${text}`);
}

function summary(name) {
  console.log(`\n${name}: ${checks - failures}/${checks} comprobaciones correctas`);
  return failures;
}

function reset() {
  failures = 0;
  checks = 0;
}

module.exports = { expectRule, expectEqual, expectTrue, title, summary, reset };

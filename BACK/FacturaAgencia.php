<?php
include_once 'conexion_bd.php';

$dni=$_POST['dni'];
$IDagencia=$_POST['IDagencia'];

$ordenSQL3 = "SELECT MAX(idFactura) as idFactura FROM factura";
$consulta3 = $conexion->query($ordenSQL3);
$id = Array();
if ($consulta3) {
    $fila = $consulta3->fetch_array();
    while ($fila) {
        $id[] = $fila['idFactura'];
        $fila = $consulta3->fetch_array();
    }
}
$ids = implode($id);

$ordenSQL = "INSERT INTO agenciaenvio (idFactAgenciaEnv, idAgenciaEnvio, dniFactAgenciaEnvio) VALUES('$ids', '$IDagencia','$dni');";
$consulta = $conexion->query($ordenSQL);
$resultado="";
	if($consulta==null){
           $resultado="mal";
           echo json_encode($resultado);
        }else {
			       $resultado="bien";
           	echo json_encode($resultado);  
        }
$conexion->close();
<?php
include_once 'conexion_bd.php';

$direc=$_POST['direccion'];

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

$ordenSQL = "INSERT INTO otrosenvio (idFactEnvio, dirFactEnvio) VALUES('$ids', '$direc');";
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
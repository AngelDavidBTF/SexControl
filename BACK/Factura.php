<?php
include_once 'conexion_bd.php';

$idUsu = $_POST['id'];
$fecha = $_POST['fecha'];
$forma=$_POST['formaEnvio'];


$ordenSQL = "INSERT INTO factura (idFactura, idUsuFactura, fechFactura, formEnvioFact) VALUES(null, '$idUsu', '$fecha','$forma');";
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
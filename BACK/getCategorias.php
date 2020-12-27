<?php
include_once 'conexion_bd.php';


$ordenSQL = "SELECT * FROM categorias;";
$consulta = $conexion->query($ordenSQL);
$arrayResultado = Array();
if ($consulta) {
    $fila = $consulta->fetch_array();
    while ($fila) {
        $arrayResultado[] = $fila['denomCategoria'];
        $fila = $consulta->fetch_array();
    }
}
echo json_encode($arrayResultado);
$conexion->close();
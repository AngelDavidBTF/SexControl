<?php
include_once 'conexion_bd.php';


$ordenSQL = "SELECT DISTINCT resolucion, idCatArticulo FROM articulos";
$consulta = $conexion->query($ordenSQL);
$arrayResultado = Array();
if ($consulta) {
    $fila = $consulta->fetch_array();
    while ($fila) {
        $arrayResultado[] = $fila;
        $fila = $consulta->fetch_array();
    }
}
echo json_encode($arrayResultado);
$conexion->close();
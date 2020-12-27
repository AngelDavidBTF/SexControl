<?php
include_once 'conexion_bd.php';


$ordenSQL = "SELECT A.*, Al.* FROM articulos A, almacen Al WHERE A.idArticulo = Al.idArtAlmacen;";
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
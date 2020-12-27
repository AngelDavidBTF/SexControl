<?php
include_once 'conexion_bd.php';

$json = $_POST['jsonString'];
$data=json_decode($json);

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
$numero=count($data);

$resultado="";
for ($i = 0; $i < $numero ; $i++) {
    $idArt = $data[$i]->idArticulo;
	$precArt = $data[$i]->precioArtAlmacen;
	$cantidadArt=$data[$i]->cantidad;

           	$ordenSQL1 = "INSERT INTO detfactura (idDetFact, idFactDetalle, idArtDetalle, precioDetalle, uniDetalle) VALUES(null, '$ids', '$idArt', '$precArt','$cantidadArt');";
			$consulta1 = $conexion->query($ordenSQL1);
			
	if($consulta1==null){
           $resultado="mal";
        }else{ 
			$ordenSQL2 = "UPDATE almacen SET stockArtAlmacen=(stockArtAlmacen - $cantidadArt) WHERE idArtAlmacen='$idArt';";
			$consulta2 = $conexion->query($ordenSQL2);
			$filasfectadas = mysqli_affected_rows($conexion);


			if($filasfectadas >= 1){
				$resultado="bien";
			} else{
				$resultado="mal";
			}
        }
}

echo json_encode($resultado);

$conexion->close();
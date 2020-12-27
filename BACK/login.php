<?php
include_once 'conexion_bd.php';

$dni=$_POST['dni'];
$contrasena=$_POST['pass'];

$ordenSQL = "SELECT nombreUsuario FROM USUARIOS  WHERE dni ='$dni' AND claveUsuario=AES_ENCRYPT('$contrasena','AngelDavid');";
 $resultados = mysqli_query($conexion, $ordenSQL);
        $dimension =$resultados->num_rows;

        if($dimension==1){
           $resultado=1;
           echo json_encode($resultado);
        }else {
           $resultado=2;
           echo json_encode($resultado);  
        }

$conexion->close();
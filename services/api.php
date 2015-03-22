<?php
	require_once("Rest.inc.php");

	class API extends REST {

		public $data = "";

		const DB_SERVER = "localhost";
		const DB_USER = "trafalgar_ang";
		const DB_PASSWORD = "ang";
		const DB = "trafalgar_ang";

		private $db = NULL;
		private $mysqli = NULL;
		public function __construct(){
			parent::__construct();				// Init parent contructor
			$this->dbConnect();					// Initiate Database connection
		}
		
		/*
		 *  Connect to Database
		*/
		private function dbConnect(){
			$this->mysqli = new mysqli(self::DB_SERVER, self::DB_USER, self::DB_PASSWORD, self::DB);
		}
		
		/*
		 * Dynmically call the method based on the query string
		 */
		public function processApi(){
			$func = strtolower(trim(str_replace("/","",$_REQUEST['x'])));
			if((int)method_exists($this,$func) > 0)
				$this->$func();
			else
				$this->response('',404); // If the method not exist with in this class "Page not found".
		}
				
		private function login(){
			if($this->get_request_method() != "POST"){
				$this->response('',406);
			}
			$user = json_decode(file_get_contents("php://input"),true);
			// $this->response(var_dump($user));
			$email = mysql_real_escape_string($user['email']);
			$password = mysql_real_escape_string($user['pass']);
			// !empty($email) ? $this->response($email) : $this->response('not nice'); die();
			if(!empty($email) and !empty($password)){
				// if(filter_var($email, FILTER_VALIDATE_EMAIL)){
					// $this->response('proceeding... second if'); die();
					$query="SELECT uid, name, password FROM users WHERE name = '$email' AND password = '$password' LIMIT 1";
					$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);

					if($r->num_rows > 0) {
						$result = $r->fetch_assoc();
						// If success everythig is good send header as "OK" and user details
						print 'success';
						// $this->response($this->json($result), 200);
					}
					$this->response('', 204);	// If no records "No Content" status
					print 'error';
				// }
			}
			
			$error = array('status' => "Failed", "msg" => "Invalid Email address or Password");
			$this->response($this->json($error), 400);
		}
		
		private function words(){	
			if($this->get_request_method() != "GET"){
				$this->response('',406);
			}
			$query="SELECT distinct c.wid, c.word, c.meaning FROM words c order by c.wid desc";
			$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
			if($r->num_rows > 0){
				$result = array();
				while($row = $r->fetch_assoc()){
					$result[] = $row;
				}
				$this->response($this->json($result), 200);
			}
			$this->response('',204);
		}
		private function word(){	
			if($this->get_request_method() != "GET"){
				$this->response('',406);
			}
			$id = (int)$this->_request['id'];
			if($id > 0){	
				$query="SELECT distinct c.wid, c.word, c.meaning FROM words c where c.wid=$id";
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				if($r->num_rows > 0) {
					$result = $r->fetch_assoc();	
					$this->response($this->json($result), 200); // send user details
				}
			}
			$this->response('',204);	// If no records "No Content" status
		}
		
		private function insertWord(){
			if($this->get_request_method() != "POST"){
				$this->response('',406);
			}
			$word = json_decode(file_get_contents("php://input"),true);
			$column_names = array('word', 'meaning');
			$keys = array_keys($word);
			$columns = '';
			$values = '';
			foreach($column_names as $desired_key){
			   if(!in_array($desired_key, $keys)) {
			   		$temp_key = '';
			   		$desired_key = '';
				}else{
					$temp_key = $word[$desired_key];
				}
				$columns = $columns.$desired_key.',';
				$values = $values."'".$temp_key."',";
			}
			$query = "INSERT INTO words(".trim($columns,',').") VALUES(".trim($values,',').")";
			if(!empty($word)){
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				$success = array('status' => "Success", "msg" => "Word Inserted Successfully.", "data" => $word);
				$this->response($this->json($success),200);
			}else
				$this->response('',204);	//"No Content" status
		}
		private function updateWord(){
			if($this->get_request_method() != "POST"){
				$this->response('',406);
			}
			$word = json_decode(file_get_contents("php://input"),true);
			$id = (int)$word['id'];
			$column_names = array('word', 'meaning');
			$keys = array_keys($word['word']);
			$columns = '';
			$values = '';
			foreach($column_names as $desired_key){ // Check the customer received. If key does not exist, insert blank into the array.
			   if(!in_array($desired_key, $keys)) {
			   		$temp_key = '';
			   		$desired_key = '';
				}else{
					$temp_key = $word['word'][$desired_key];
				}
				$columns = $columns.$desired_key."='".$temp_key."',";
			}
			$query = "UPDATE words SET ".trim($columns,',')." WHERE wid=$id";
			if(!empty($word)){
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				$success = array('status' => "Success", "msg" => "word ".$id." Updated Successfully.", "data" => $word);
				$this->response($this->json($success),200);
			}else
				$this->response('',204);	// "No Content" status
		}
		
		private function deleteWord(){
			if($this->get_request_method() != "DELETE"){
				$this->response('',406);
			}
			$id = (int)$this->_request['id'];
			if($id > 0){				
				$query="DELETE FROM words WHERE wid = $id";
				$r = $this->mysqli->query($query) or die($this->mysqli->error.__LINE__);
				$success = array('status' => "Success", "msg" => "Successfully deleted one record.");
				$this->response($this->json($success),200);
			}else
				$this->response('',204);	// If no records "No Content" status
		}
		
		/*
		 *	Encode array into JSON
		*/
		private function json($data){
			if(is_array($data)){
				return json_encode($data);
			}
		}
	}
	
	// Initiiate Library
	
	$api = new API;
	$api->processApi();
?>
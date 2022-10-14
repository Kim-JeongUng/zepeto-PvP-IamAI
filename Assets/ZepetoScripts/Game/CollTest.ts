import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { CharacterController, Collider, Collision, ControllerColliderHit} from 'UnityEngine'

export default class CollTest extends ZepetoScriptBehaviour {
    public cc:CharacterController
    Awkae() {    
        console.log("HI")
        this.cc = this.GetComponent<CharacterController>();
    }
    Update(){
    }
    
    //피격 받았을 때
    OnControllerColliderHit(hit: ControllerColliderHit){
        
        console.log("ㅁㄴㅇㅁㄴ");
        if(hit.transform.name=="hand_R"){
            console.log("hand");
        }
    }

}
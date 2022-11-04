import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Collider, GameObject, SphereCollider} from "UnityEngine";
import GameManager from './GameManager';

export default class RightHand extends ZepetoScriptBehaviour {

    private gameManager: GameManager;
    private rightHand :SphereCollider;
    
    Start() {
        this.gameManager = GameObject.FindObjectOfType<GameManager>();
        this.rightHand = this.GetComponent<SphereCollider>();
    }

    //누굴 때리면
    OnTriggerEnter(coll: Collider) {
        if (coll.transform.root == this.transform.root)
            return;
        this.gameManager.Kill(this.transform.root, coll.transform.root)
        this.rightHand.enabled = false;
    }
}
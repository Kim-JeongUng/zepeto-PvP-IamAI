import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Slider, Button } from "UnityEngine.UI";
import TPSController from './TPS/TPSController';
import ClientStarterV2 from './ClientStarterV2';
import { AnimationClip, GameObject, WaitForSeconds } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';

export default class UI_Event extends ZepetoScriptBehaviour {

    public punch: Button;
    public punchGesture: AnimationClip;
    private zepetoCharacter: ZepetoCharacter;

    Start() {
        this.punch.onClick.AddListener(() => {
            // add button click event
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            this.zepetoCharacter.SetGesture(this.punchGesture);
            console.log('btnUI onClick');
            this.StartCoroutine(this.DoRoutine());
        
        });
    }
    //after 3 seconds later, stop gesture
    * DoRoutine() {
        yield new WaitForSeconds(2);
        this.zepetoCharacter.CancelGesture();
    }
}
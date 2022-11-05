import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {ZepetoPlayers} from "ZEPETO.Character.Controller";
import ClientStarterV2 from './ClientStarterV2';
import {Room} from "ZEPETO.Multiplay";
import { GameObject } from 'UnityEngine';

export default class GameEndPanel extends ZepetoScriptBehaviour {
    @SerializeField() private EndPanel : GameObject;

    private room : Room;
    
    Start(){
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.room = ClientStarterV2.instance.room;
            this.room.AddMessageHandler("OnEndGame", (message) => {
                this.EndPanel.SetActive(true);
            });
        });
    }

}
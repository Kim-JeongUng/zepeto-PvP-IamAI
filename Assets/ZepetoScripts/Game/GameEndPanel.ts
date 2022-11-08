import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoPlayers} from "ZEPETO.Character.Controller";
import ClientStarterV2 from './ClientStarterV2';
import {Room} from "ZEPETO.Multiplay";
import {GameObject, Texture, WaitForSeconds} from 'UnityEngine';
import {RawImage, Text} from "UnityEngine.UI";
import {Users, ZepetoWorldHelper} from "ZEPETO.World";

export default class GameEndPanel extends ZepetoScriptBehaviour {
    @SerializeField() private EndPanel: GameObject;
    @SerializeField() private winnerName: Text;
    @SerializeField() private winnerThumb: RawImage;

    private room: Room;

    private Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.room = ClientStarterV2.instance.room;
            this.room.AddMessageHandler("OnEndGame", (message: string) => {
                this.StartCoroutine(this.GameEndPanelOpen(message));
            });

            this.room.AddMessageHandler("GameStart", (message: string) => {
                this.EndPanel.SetActive(false);
            });
        });
    }

    private* GameEndPanelOpen(winnerID: string) {
        const userId: string[] = [];
        userId.push(winnerID);
        ZepetoWorldHelper.GetUserInfo(userId, (info: Users[]) => {
            this.winnerName.text = info[0].name;
            ZepetoWorldHelper.GetProfileTexture(userId[0], (thumb: Texture) => {
                this.winnerThumb.GetComponent<RawImage>().texture = thumb;
            }, () => {
                console.log(userId[0]);
            });
        }, () => {
            this.winnerName.text = "null";
        });
        yield new WaitForSeconds(3);

        this.EndPanel.SetActive(true);
    }
}
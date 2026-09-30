import { Player, Position, PlayStyle } from '../types/game';
import { ALL_116_CLUBS } from './clubsData';
import { CURATED_REAL_SQUADS } from './squadsCatalog';
import { makeRealPlayer } from './realPlayersDatabase';

// Real prominent rosters index for all other clubs
export interface RosterSeed {
  name: string;
  position: Position;
  age: number;
  nationality: string;
  ovr: number;
  shirtNumber: number;
  playstyle?: PlayStyle;
  preferredFoot?: '右' | '左' | '両足';
}

export const ADDITIONAL_CLUB_SEEDS: Record<string, RosterSeed[]> = {
  // PREMIER LEAGUE
  aston_villa: [
    { name: 'Emiliano Martínez', position: 'GK', age: 34, nationality: 'アルゼンチン', ovr: 87, shirtNumber: 23 },
    { name: 'Ezri Konsa', position: 'CB', age: 28, nationality: 'イングランド', ovr: 83, shirtNumber: 4 },
    { name: 'Pau Torres', position: 'CB', age: 29, nationality: 'スペイン', ovr: 84, shirtNumber: 14 },
    { name: 'Matty Cash', position: 'RB', age: 29, nationality: 'ポーランド', ovr: 80, shirtNumber: 2 },
    { name: 'Lucas Digne', position: 'LB', age: 33, nationality: 'フランス', ovr: 80, shirtNumber: 12 },
    { name: 'Amadou Onana', position: 'CDM', age: 25, nationality: 'ベルギー', ovr: 82, shirtNumber: 24 },
    { name: 'Youri Tielemans', position: 'CM', age: 29, nationality: 'ベルギー', ovr: 83, shirtNumber: 8 },
    { name: 'John McGinn', position: 'CM', age: 31, nationality: 'スコットランド', ovr: 82, shirtNumber: 7 },
    { name: 'Leon Bailey', position: 'RW', age: 29, nationality: 'ジャマイカ', ovr: 82, shirtNumber: 31 },
    { name: 'Ollie Watkins', position: 'ST', age: 30, nationality: 'イングランド', ovr: 85, shirtNumber: 11 },
    { name: 'Morgan Rogers', position: 'LW', age: 24, nationality: 'イングランド', ovr: 81, shirtNumber: 27 },
    { name: 'Jhon Durán', position: 'ST', age: 22, nationality: 'コロンビア', ovr: 81, shirtNumber: 9 },
    { name: 'Emiliano Buendía', position: 'CAM', age: 29, nationality: 'アルゼンチン', ovr: 80, shirtNumber: 10 },
    { name: 'Ian Maatsen', position: 'LB', age: 24, nationality: 'オランダ', ovr: 80, shirtNumber: 22 },
    { name: 'Diego Carlos', position: 'CB', age: 33, nationality: 'ブラジル', ovr: 79, shirtNumber: 3 },
    { name: 'Boubacar Kamara', position: 'CDM', age: 26, nationality: 'フランス', ovr: 81, shirtNumber: 44 },
    { name: 'Ross Barkley', position: 'CM', age: 32, nationality: 'イングランド', ovr: 78, shirtNumber: 6 },
    { name: 'Robin Olsen', position: 'GK', age: 36, nationality: 'スウェーデン', ovr: 75, shirtNumber: 25 }
  ],

  tottenham: [
    { name: 'Guglielmo Vicario', position: 'GK', age: 29, nationality: 'イタリア', ovr: 84, shirtNumber: 1 },
    { name: 'Cristian Romero', position: 'CB', age: 28, nationality: 'アルゼンチン', ovr: 85, shirtNumber: 17 },
    { name: 'Micky van de Ven', position: 'CB', age: 25, nationality: 'オランダ', ovr: 84, shirtNumber: 37 },
    { name: 'Pedro Porro', position: 'RB', age: 26, nationality: 'スペイン', ovr: 83, shirtNumber: 23 },
    { name: 'Destiny Udogie', position: 'LB', age: 23, nationality: 'イタリア', ovr: 83, shirtNumber: 13 },
    { name: 'Yves Bissouma', position: 'CDM', age: 29, nationality: 'マリ', ovr: 81, shirtNumber: 8 },
    { name: 'Pape Matar Sarr', position: 'CM', age: 23, nationality: 'セネガル', ovr: 81, shirtNumber: 29 },
    { name: 'James Maddison', position: 'CAM', age: 29, nationality: 'イングランド', ovr: 85, shirtNumber: 10 },
    { name: 'Dejan Kulusevski', position: 'RW', age: 26, nationality: 'スウェーデン', ovr: 84, shirtNumber: 21 },
    { name: 'Dominic Solanke', position: 'ST', age: 28, nationality: 'イングランド', ovr: 82, shirtNumber: 19 },
    { name: '孫 興民 (Son Heung-min)', position: 'LW', age: 34, nationality: '韓国', ovr: 86, shirtNumber: 7 },
    { name: 'Brennan Johnson', position: 'RW', age: 25, nationality: 'ウェールズ', ovr: 81, shirtNumber: 22 },
    { name: 'Richarlison', position: 'ST', age: 29, nationality: 'ブラジル', ovr: 81, shirtNumber: 9 },
    { name: 'Rodrigo Bentancur', position: 'CM', age: 29, nationality: 'ウルグアイ', ovr: 82, shirtNumber: 30 },
    { name: 'Radu Drăgușin', position: 'CB', age: 24, nationality: 'ルーマニア', ovr: 79, shirtNumber: 6 },
    { name: 'Archie Gray', position: 'RB', age: 20, nationality: 'イングランド', ovr: 77, shirtNumber: 14 },
    { name: 'Lucas Bergvall', position: 'CM', age: 20, nationality: 'スウェーデン', ovr: 76, shirtNumber: 15 },
    { name: 'Fraser Forster', position: 'GK', age: 38, nationality: 'イングランド', ovr: 74, shirtNumber: 20 }
  ],

  chelsea: [
    { name: 'Robert Sánchez', position: 'GK', age: 28, nationality: 'スペイン', ovr: 81, shirtNumber: 1 },
    { name: 'Levi Colwill', position: 'CB', age: 23, nationality: 'イングランド', ovr: 82, shirtNumber: 6 },
    { name: 'Wesley Fofana', position: 'CB', age: 25, nationality: 'フランス', ovr: 81, shirtNumber: 29 },
    { name: 'Reece James', position: 'RB', age: 26, nationality: 'イングランド', ovr: 84, shirtNumber: 24 },
    { name: 'Marc Cucurella', position: 'LB', age: 28, nationality: 'スペイン', ovr: 82, shirtNumber: 3 },
    { name: 'Moisés Caicedo', position: 'CDM', age: 24, nationality: 'エクアドル', ovr: 85, shirtNumber: 25 },
    { name: 'Enzo Fernández', position: 'CM', age: 25, nationality: 'アルゼンチン', ovr: 84, shirtNumber: 8 },
    { name: 'Cole Palmer', position: 'CAM', age: 24, nationality: 'イングランド', ovr: 87, shirtNumber: 20 },
    { name: 'Noni Madueke', position: 'RW', age: 24, nationality: 'イングランド', ovr: 81, shirtNumber: 11 },
    { name: 'Nicolas Jackson', position: 'ST', age: 25, nationality: 'セネガル', ovr: 82, shirtNumber: 15 },
    { name: 'Pedro Neto', position: 'LW', age: 26, nationality: 'ポルトガル', ovr: 82, shirtNumber: 7 },
    { name: 'Christopher Nkunku', position: 'CF', age: 28, nationality: 'フランス', ovr: 84, shirtNumber: 18 },
    { name: 'Jadon Sancho', position: 'LW', age: 26, nationality: 'イングランド', ovr: 81, shirtNumber: 19 },
    { name: 'Malo Gusto', position: 'RB', age: 23, nationality: 'フランス', ovr: 80, shirtNumber: 27 },
    { name: 'Roméo Lavia', position: 'CDM', age: 22, nationality: 'ベルギー', ovr: 79, shirtNumber: 45 },
    { name: 'Tosin Adarabioyo', position: 'CB', age: 28, nationality: 'イングランド', ovr: 79, shirtNumber: 4 },
    { name: 'Kiernan Dewsbury-Hall', position: 'CM', age: 28, nationality: 'イングランド', ovr: 79, shirtNumber: 22 },
    { name: 'Filip Jörgensen', position: 'GK', age: 24, nationality: 'デンマーク', ovr: 78, shirtNumber: 12 }
  ],

  man_united: [
    { name: 'André Onana', position: 'GK', age: 30, nationality: 'カメルーン', ovr: 83, shirtNumber: 24 },
    { name: 'Matthijs de Ligt', position: 'CB', age: 27, nationality: 'オランダ', ovr: 85, shirtNumber: 4 },
    { name: 'Lisandro Martínez', position: 'CB', age: 28, nationality: 'アルゼンチン', ovr: 84, shirtNumber: 6 },
    { name: 'Diogo Dalot', position: 'RB', age: 27, nationality: 'ポルトガル', ovr: 82, shirtNumber: 20 },
    { name: 'Luke Shaw', position: 'LB', age: 31, nationality: 'イングランド', ovr: 81, shirtNumber: 23 },
    { name: 'Kobbie Mainoo', position: 'CM', age: 21, nationality: 'イングランド', ovr: 83, shirtNumber: 37 },
    { name: 'Manuel Ugarte', position: 'CDM', age: 25, nationality: 'ウルグアイ', ovr: 82, shirtNumber: 25 },
    { name: 'Bruno Fernandes', position: 'CAM', age: 32, nationality: 'ポルトガル', ovr: 87, shirtNumber: 8 },
    { name: 'Alejandro Garnacho', position: 'RW', age: 22, nationality: 'アルゼンチン', ovr: 83, shirtNumber: 17 },
    { name: 'Rasmus Højlund', position: 'ST', age: 23, nationality: 'デンマーク', ovr: 81, shirtNumber: 9 },
    { name: 'Marcus Rashford', position: 'LW', age: 28, nationality: 'イングランド', ovr: 83, shirtNumber: 10 },
    { name: 'Joshua Zirkzee', position: 'ST', age: 25, nationality: 'オランダ', ovr: 80, shirtNumber: 11 },
    { name: 'Amad Diallo', position: 'RW', age: 24, nationality: 'コートジボワール', ovr: 80, shirtNumber: 16 },
    { name: 'Casemiro', position: 'CDM', age: 34, nationality: 'ブラジル', ovr: 82, shirtNumber: 18 },
    { name: 'Noussair Mazraoui', position: 'RB', age: 28, nationality: 'モロッコ', ovr: 81, shirtNumber: 3 },
    { name: 'Harry Maguire', position: 'CB', age: 33, nationality: 'イングランド', ovr: 80, shirtNumber: 5 },
    { name: 'Mason Mount', position: 'CAM', age: 27, nationality: 'イングランド', ovr: 80, shirtNumber: 7 },
    { name: 'Altay Bayındır', position: 'GK', age: 28, nationality: 'トルコ', ovr: 77, shirtNumber: 1 }
  ],

  ipswich: [
    { name: 'Arijanet Muric', position: 'GK', age: 27, nationality: 'コソボ', ovr: 76, shirtNumber: 1 },
    { name: 'Jacob Greaves', position: 'CB', age: 26, nationality: 'イングランド', ovr: 75, shirtNumber: 24 },
    { name: 'Luke Woolfenden', position: 'CB', age: 27, nationality: 'イングランド', ovr: 73, shirtNumber: 6 },
    { name: 'Axel Tuanzebe', position: 'RB', age: 28, nationality: 'コンゴ民主共和国', ovr: 74, shirtNumber: 40 },
    { name: 'Leif Davis', position: 'LB', age: 26, nationality: 'イングランド', ovr: 76, shirtNumber: 3 },
    { name: 'Sam Morsy', position: 'CDM', age: 34, nationality: 'エジプト', ovr: 74, shirtNumber: 5 },
    { name: 'Jens Cajuste', position: 'CM', age: 27, nationality: 'スウェーデン', ovr: 75, shirtNumber: 12 },
    { name: 'Kalvin Phillips', position: 'CDM', age: 30, nationality: 'イングランド', ovr: 75, shirtNumber: 8 },
    { name: 'Omari Hutchinson', position: 'CAM', age: 22, nationality: 'イングランド', ovr: 76, shirtNumber: 20 },
    { name: 'Liam Delap', position: 'ST', age: 23, nationality: 'イングランド', ovr: 77, shirtNumber: 19 },
    { name: 'Sammie Szmodics', position: 'LW', age: 30, nationality: 'アイルランド', ovr: 76, shirtNumber: 23 },
    { name: 'Wes Burns', position: 'RW', age: 31, nationality: 'ウェールズ', ovr: 73, shirtNumber: 7 },
    { name: 'Jack Clarke', position: 'LW', age: 25, nationality: 'イングランド', ovr: 75, shirtNumber: 47 },
    { name: 'George Hirst', position: 'ST', age: 27, nationality: 'イングランド', ovr: 73, shirtNumber: 27 },
    { name: 'Dara OShea', position: 'CB', age: 27, nationality: 'アイルランド', ovr: 74, shirtNumber: 26 },
    { name: 'Conor Townsend', position: 'LB', age: 33, nationality: 'イングランド', ovr: 72, shirtNumber: 22 },
    { name: 'Massimo Luongo', position: 'CM', age: 33, nationality: 'オーストラリア', ovr: 72, shirtNumber: 25 },
    { name: 'Christian Walton', position: 'GK', age: 30, nationality: 'イングランド', ovr: 72, shirtNumber: 28 }
  ],

  // BUNDESLIGA
  bayern: [
    { name: 'Manuel Neuer', position: 'GK', age: 40, nationality: 'ドイツ', ovr: 88, shirtNumber: 1 },
    { name: 'Dayot Upamecano', position: 'CB', age: 27, nationality: 'フランス', ovr: 85, shirtNumber: 2 },
    { name: '金 玟哉 (Kim Min-jae)', position: 'CB', age: 29, nationality: '韓国', ovr: 86, shirtNumber: 3 },
    { name: 'Joshua Kimmich', position: 'RB', age: 31, nationality: 'ドイツ', ovr: 88, shirtNumber: 6 },
    { name: 'Alphonso Davies', position: 'LB', age: 25, nationality: 'カナダ', ovr: 85, shirtNumber: 19 },
    { name: 'João Palhinha', position: 'CDM', age: 31, nationality: 'ポルトガル', ovr: 85, shirtNumber: 16 },
    { name: 'Leon Goretzka', position: 'CM', age: 31, nationality: 'ドイツ', ovr: 84, shirtNumber: 8 },
    { name: 'Jamal Musiala', position: 'CAM', age: 23, nationality: 'ドイツ', ovr: 89, shirtNumber: 42 },
    { name: 'Michael Olise', position: 'RW', age: 24, nationality: 'フランス', ovr: 85, shirtNumber: 17 },
    { name: 'Harry Kane', position: 'ST', age: 33, nationality: 'イングランド', ovr: 90, shirtNumber: 9 },
    { name: 'Leroy Sané', position: 'LW', age: 30, nationality: 'ドイツ', ovr: 85, shirtNumber: 10 },
    { name: 'Kingsley Coman', position: 'LW', age: 30, nationality: 'フランス', ovr: 84, shirtNumber: 11 },
    { name: 'Serge Gnabry', position: 'RW', age: 31, nationality: 'ドイツ', ovr: 83, shirtNumber: 7 },
    { name: 'Thomas Müller', position: 'CF', age: 37, nationality: 'ドイツ', ovr: 83, shirtNumber: 25 },
    { name: 'Konrad Laimer', position: 'CM', age: 29, nationality: 'オーストリア', ovr: 82, shirtNumber: 27 },
    { name: 'Eric Dier', position: 'CB', age: 32, nationality: 'イングランド', ovr: 80, shirtNumber: 15 },
    { name: 'Raphaël Guerreiro', position: 'LB', age: 32, nationality: 'ポルトガル', ovr: 81, shirtNumber: 22 },
    { name: 'Mathys Tel', position: 'ST', age: 21, nationality: 'フランス', ovr: 79, shirtNumber: 39 }
  ],

  leverkusen: [
    { name: 'Lukáš Hrádecký', position: 'GK', age: 36, nationality: 'フィンランド', ovr: 84, shirtNumber: 1 },
    { name: 'Jonathan Tah', position: 'CB', age: 30, nationality: 'ドイツ', ovr: 86, shirtNumber: 4 },
    { name: 'Edmond Tapsoba', position: 'CB', age: 27, nationality: 'ブルキナファソ', ovr: 84, shirtNumber: 12 },
    { name: 'Piero Hincapié', position: 'CB', age: 24, nationality: 'エクアドル', ovr: 83, shirtNumber: 3 },
    { name: 'Jeremie Frimpong', position: 'RWB', age: 25, nationality: 'オランダ', ovr: 85, shirtNumber: 30 },
    { name: 'Alejandro Grimaldo', position: 'LWB', age: 30, nationality: 'スペイン', ovr: 86, shirtNumber: 20 },
    { name: 'Granit Xhaka', position: 'CM', age: 33, nationality: 'スイス', ovr: 86, shirtNumber: 34 },
    { name: 'Robert Andrich', position: 'CM', age: 31, nationality: 'ドイツ', ovr: 83, shirtNumber: 8 },
    { name: 'Florian Wirtz', position: 'CAM', age: 23, nationality: 'ドイツ', ovr: 89, shirtNumber: 10 },
    { name: 'Martin Terrier', position: 'LW', age: 29, nationality: 'フランス', ovr: 82, shirtNumber: 11 },
    { name: 'Victor Boniface', position: 'ST', age: 25, nationality: 'ナイジェリア', ovr: 84, shirtNumber: 22 },
    { name: 'Patrik Schick', position: 'ST', age: 30, nationality: 'チェコ', ovr: 82, shirtNumber: 14 },
    { name: 'Exequiel Palacios', position: 'CM', age: 27, nationality: 'アルゼンチン', ovr: 83, shirtNumber: 25 },
    { name: 'Aleix García', position: 'CM', age: 29, nationality: 'スペイン', ovr: 82, shirtNumber: 24 },
    { name: 'Jonas Hofmann', position: 'CAM', age: 34, nationality: 'ドイツ', ovr: 81, shirtNumber: 7 },
    { name: 'Amine Adli', position: 'RW', age: 26, nationality: 'モロッコ', ovr: 81, shirtNumber: 21 },
    { name: 'Jeanuel Belocian', position: 'CB', age: 21, nationality: 'フランス', ovr: 76, shirtNumber: 44 },
    { name: 'Matej Kovář', position: 'GK', age: 26, nationality: 'チェコ', ovr: 77, shirtNumber: 17 }
  ],

  // SERIE A
  inter: [
    { name: 'Yann Sommer', position: 'GK', age: 37, nationality: 'スイス', ovr: 86, shirtNumber: 1 },
    { name: 'Alessandro Bastoni', position: 'CB', age: 27, nationality: 'イタリア', ovr: 87, shirtNumber: 95 },
    { name: 'Francesco Acerbi', position: 'CB', age: 38, nationality: 'イタリア', ovr: 83, shirtNumber: 15 },
    { name: 'Benjamin Pavard', position: 'CB', age: 30, nationality: 'フランス', ovr: 84, shirtNumber: 28 },
    { name: 'Denzel Dumfries', position: 'RWB', age: 30, nationality: 'オランダ', ovr: 82, shirtNumber: 2 },
    { name: 'Federico Dimarco', position: 'LWB', age: 28, nationality: 'イタリア', ovr: 85, shirtNumber: 32 },
    { name: 'Hakan Çalhanoğlu', position: 'CDM', age: 32, nationality: 'トルコ', ovr: 87, shirtNumber: 20 },
    { name: 'Nicolò Barella', position: 'CM', age: 29, nationality: 'イタリア', ovr: 87, shirtNumber: 23 },
    { name: 'Henrikh Mkhitaryan', position: 'CM', age: 37, nationality: 'アルメニア', ovr: 83, shirtNumber: 22 },
    { name: 'Marcus Thuram', position: 'ST', age: 29, nationality: 'フランス', ovr: 85, shirtNumber: 9 },
    { name: 'Lautaro Martínez', position: 'ST', age: 29, nationality: 'アルゼンチン', ovr: 89, shirtNumber: 10 },
    { name: 'Mehdi Taremi', position: 'ST', age: 34, nationality: 'イラン', ovr: 81, shirtNumber: 99 },
    { name: 'Davide Frattesi', position: 'CM', age: 26, nationality: 'イタリア', ovr: 82, shirtNumber: 16 },
    { name: 'Piotr Zieliński', position: 'CM', age: 32, nationality: 'ポーランド', ovr: 82, shirtNumber: 7 },
    { name: 'Stefan de Vrij', position: 'CB', age: 34, nationality: 'オランダ', ovr: 81, shirtNumber: 6 },
    { name: 'Carlos Augusto', position: 'LWB', age: 27, nationality: 'ブラジル', ovr: 80, shirtNumber: 30 },
    { name: 'Yann Bisseck', position: 'CB', age: 25, nationality: 'ドイツ', ovr: 80, shirtNumber: 31 },
    { name: 'Josep Martínez', position: 'GK', age: 28, nationality: 'スペイン', ovr: 79, shirtNumber: 13 }
  ],

  // LIGUE 1
  psg: [
    { name: 'Gianluigi Donnarumma', position: 'GK', age: 27, nationality: 'イタリア', ovr: 88, shirtNumber: 1 },
    { name: 'Marquinhos', position: 'CB', age: 32, nationality: 'ブラジル', ovr: 86, shirtNumber: 5 },
    { name: 'Willian Pacho', position: 'CB', age: 24, nationality: 'エクアドル', ovr: 83, shirtNumber: 51 },
    { name: 'Achraf Hakimi', position: 'RB', age: 27, nationality: 'モロッコ', ovr: 86, shirtNumber: 2 },
    { name: 'Nuno Mendes', position: 'LB', age: 24, nationality: 'ポルトガル', ovr: 84, shirtNumber: 25 },
    { name: 'Vitinha', position: 'CM', age: 26, nationality: 'ポルトガル', ovr: 86, shirtNumber: 17 },
    { name: 'Warren Zaïre-Emery', position: 'CM', age: 20, nationality: 'フランス', ovr: 84, shirtNumber: 33 },
    { name: 'João Neves', position: 'CM', age: 21, nationality: 'ポルトガル', ovr: 83, shirtNumber: 87 },
    { name: 'Ousmane Dembélé', position: 'RW', age: 29, nationality: 'フランス', ovr: 86, shirtNumber: 10 },
    { name: 'Randal Kolo Muani', position: 'ST', age: 27, nationality: 'フランス', ovr: 82, shirtNumber: 23 },
    { name: 'Bradley Barcola', position: 'LW', age: 24, nationality: 'フランス', ovr: 84, shirtNumber: 29 },
    { name: '李 康仁 (Lee Kang-in)', position: 'RW', age: 25, nationality: '韓国', ovr: 82, shirtNumber: 19 },
    { name: 'Désiré Doué', position: 'LW', age: 21, nationality: 'フランス', ovr: 80, shirtNumber: 14 },
    { name: 'Marco Asensio', position: 'CAM', age: 30, nationality: 'スペイン', ovr: 82, shirtNumber: 11 },
    { name: 'Fabián Ruiz', position: 'CM', age: 30, nationality: 'スペイン', ovr: 83, shirtNumber: 8 },
    { name: 'Lucas Beraldo', position: 'CB', age: 22, nationality: 'ブラジル', ovr: 79, shirtNumber: 35 },
    { name: 'Milan Škriniar', position: 'CB', age: 31, nationality: 'スロバキア', ovr: 81, shirtNumber: 37 },
    { name: 'Matvey Safonov', position: 'GK', age: 27, nationality: 'ロシア', ovr: 80, shirtNumber: 39 }
  ],

  };

export const REAL_FOOTBALL_NAMES_DATABASE: Record<string, { names: string[]; nationalities: string[] }> = {
  'イングランド': {
    names: [
      'James Tarkowski', 'Jordan Pickford', 'Dwight McNeil', 'Vitaliy Mykolenko', 'Jarrad Branthwaite',
      'Abdoulaye Doucouré', 'Dominic Calvert-Lewin', 'Idrissa Gueye', 'Jespur Lindstrøm', 'Jake O\'Brien',
      'Bryan Mbeumo', 'Yoane Wissa', 'Christian Nørgaard', 'Mathias Jensen', 'Mikkel Damsgaard',
      'Ethan Pinnock', 'Nathan Collins', 'Sepp van den Berg', 'Mark Flekken', 'Keane Lewis-Potter',
      'Morgan Gibbs-White', 'Callum Hudson-Odoi', 'Chris Wood', 'Murillo', 'Ola Aina',
      'Nikola Milenković', 'Elliot Anderson', 'Ryan Yates', 'Matz Sels', 'Anthony Elanga',
      'Harry Winks', 'Stephy Mavididi', 'Jamie Vardy', 'Wout Faes', 'Victor Kristiansen',
      'Mads Hermansen', 'Bilal El Khannouss', 'Jordan Ayew', 'Facundo Buonanotte', 'Jannik Vestergaard',
      'Kyle Walker-Peters', 'Taylor Harwood-Bellis', 'Jan Bednarek', 'Flynn Downes', 'Adam Lallana',
      'Cameron Archer', 'Ben Brereton Díaz', 'Mateus Fernandes', 'Joe Aribo', 'Aaron Ramsdale'
    ],
    nationalities: ['イングランド', 'スコットランド', 'アイルランド', 'ウェールズ', 'フランス', 'オランダ', 'デンマーク', 'ポルトガル', 'ブラジル', 'ナイジェリア']
  },
  'スペイン': {
    names: [
      'Álex Baena', 'Gerard Moreno', 'Yeremy Pino', 'Ayoze Pérez', 'Dani Parejo',
      'Santi Comesaña', 'Raúl Albiol', 'Kiko Femenía', 'Sergi Cardona', 'Diego Conde',
      'Isco', 'Vitor Roque', 'Giovani Lo Celso', 'Pablo Fornals', 'Marc Roca',
      'Marc Bartra', 'Diego Llorente', 'Romain Perraud', 'Rui Silva', 'Chimy Ávila',
      'Nico Williams', 'Iñaki Williams', 'Oihan Sancet', 'Dani Vivian', 'Aitor Paredes',
      'Yuri Berchiche', 'Óscar de Marcos', 'Beñat Prados', 'Julen Agirrezabala', 'Gorka Guruzeta',
      'Pepelu', 'Hugo Duro', 'Javi Guerra', 'Diego López', 'Thierry Correia',
      'Cristhian Mosquera', 'Yarek Gasiorowski', 'Giorgi Mamardashvili', 'André Almeida', 'Rafa Mir',
      'Lucas Ocampos', 'Isaac Romero', 'Dodi Lukebakio', 'Saúl Ñíguez', 'Loïc Badé',
      'Adrià Pedrosa', 'Jesús Navas', 'Djibril Sow', 'Örjan Nyland', 'Juanlu Sánchez'
    ],
    nationalities: ['スペイン', 'アルゼンチン', 'ウルグアイ', 'ブラジル', 'フランス', 'ポルトガル', 'モロッコ', 'コロンビア']
  },
  'ドイツ': {
    names: [
      'Deniz Undav', 'Ermedin Demirović', 'Enzo Millot', 'Angelo Stiller', 'Atakan Karazor',
      'Jamie Leweling', 'Maximilian Mittelstädt', 'Josha Vagnoman', 'Anthony Rouault', 'Alexander Nübel',
      'Omar Marmoush', 'Hugo Ekitiké', 'Mario Götze', 'Ellyes Skhiri', 'Robin Koch',
      'Arthur Theate', 'Rasmus Kristensen', 'Tuta', 'Kauã Santos', 'Farès Chaïbi',
      'Vincenzo Grifo', 'Ritsu Doan (堂安 律)', 'Lucas Höler', 'Junior Adamu', 'Maximilian Eggestein',
      'Nicolas Höfler', 'Christian Günter', 'Philipp Lienhart', 'Matthias Ginter', 'Noah Atubolu',
      'Andrej Kramarić', 'Marius Bülter', 'Adam Hložek', 'Tom Bischof', 'Florian Grillitsch',
      'Anton Stach', 'Pavel Kadeřábek', 'Kevin Akpoguma', 'Oliver Baumann', 'Mergim Berisha',
      'Marvin Ducksch', 'Jens Stage', 'Romano Schmid', 'Senne Lynen', 'Mitchell Weiser',
      'Felix Agu', 'Marco Friedl', 'Miloš Veljković', 'Michael Zetterer', 'Keke Topp'
    ],
    nationalities: ['ドイツ', 'オーストリア', 'スイス', 'フランス', 'オランダ', 'クロアチア', 'デンマーク', '日本']
  },
  'イタリア': {
    names: [
      'Mateo Retegui', 'Ademola Lookman', 'Charles De Ketelaere', 'Éderson', 'Marten de Roon',
      'Mario Pašalić', 'Davide Zappacosta', 'Matteo Ruggeri', 'Isak Hien', 'Marco Carnesecchi',
      'Paulo Dybala', 'Artem Dovbyk', 'Lorenzo Pellegrini', 'Matías Soulé', 'Bryan Cristante',
      'Manu Koné', 'Gianluca Mancini', 'Evan Ndicka', 'Angeliño', 'Mile Svilar',
      'Mattia Zaccagni', 'Valentín Castellanos', 'Boulaye Dia', 'Mattéo Guendouzi', 'Nicolò Rovella',
      'Manuel Lazzari', 'Nuno Tavares', 'Mario Gila', 'Alessio Romagnoli', 'Ivan Provedel',
      'Albert Guðmundsson', 'Moise Kean', 'Andrea Colpani', 'Yacine Adli', 'Edoardo Bove',
      'Danilo Cataldi', 'Dodô', 'Robin Gosens', 'Lucas Martínez Quarta', 'David de Gea',
      'Riccardo Orsolini', 'Santiago Castro', 'Dan Ndoye', 'Remo Freuler', 'Jens Odgaard',
      'Stefan Posch', 'Jhon Lucumí', 'Sam Beukema', 'Charalampos Lykogiannis', 'Łukasz Skorupski'
    ],
    nationalities: ['イタリア', 'アルゼンチン', 'ブラジル', 'フランス', 'オランダ', 'スペイン', 'クロアチア', 'ポーランド']
  },
  'フランス': {
    names: [
      'Jonathan David', 'Edon Zhegrova', 'Angel Gomes', 'Benjamin André', 'Rémy Cabella',
      'Bafodé Diakité', 'Alexsandro', 'Thomas Meunier', 'Gabriel Gudmundsson', 'Lucas Chevalier',
      'Alexandre Lacazette', 'Rayan Cherki', 'Malick Fofana', 'Corentin Tolisso', 'Maxence Caqueret',
      'Said Benrahma', 'Ainsley Maitland-Niles', 'Nicolás Tagliafico', 'Duje Ćaleta-Car', 'Lucas Perri',
      'Mason Greenwood', 'Elye Wahi', 'Pierre-Emile Højbjerg', 'Adrien Rabiot', 'Valentin Rongier',
      'Amine Harit', 'Luis Henrique', 'Leonardo Balerdi', 'Derek Cornelius', 'Gerónimo Rulli',
      'Ludovic Blas', 'Arnaud Kalimuendo', 'Albert Grønbæk', 'Baptiste Santamaria', 'Azor Matusiwa',
      'Adrien Truffert', 'Lorenz Assignon', 'Alidu Seidu', 'Christopher Wooh', 'Steve Mandanda',
      'Evann Guessand', 'Gaëtan Laborde', 'Jérémie Boga', 'Pablo Rosario', 'Tanguy Ndombele',
      'Jonathan Clauss', 'Melvin Bard', 'Dante', 'Youssouf Ndayishimiye', 'Marcin Bułka'
    ],
    nationalities: ['フランス', 'ブラジル', 'アルゼンチン', 'セネガル', 'コートジボワール', 'モロッコ', 'アルジェリア', 'ベルギー']
  }
};

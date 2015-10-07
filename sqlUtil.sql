USE `test`;
DROP TABLE IF EXISTS `UserGroups`;
DROP TABLE IF EXISTS `Groups`;
DROP TABLE IF EXISTS `Friends`;
CREATE TABLE `Groups` (
  `groupId` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `desc` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`groupId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

CREATE TABLE `UserGroups` (
  `groupId` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(45) NOT NULL,
  PRIMARY KEY (`groupId`,`email`),
  KEY `email_idx` (`email`),
  CONSTRAINT `email` FOREIGN KEY (`email`) REFERENCES `users` (`email`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `groupId` FOREIGN KEY (`groupId`) REFERENCES `Groups` (`groupId`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

/*type= 'LE(life event)'*/
CREATE TABLE `Posts` (
  `postId` int(11) NOT NULL AUTO_INCREMENT,
  `postEmail` varchar(45) NOT NULL,
  `pDesc` varchar(45) NOT NULL,
  `type` varchar(45) NULL,
  PRIMARY KEY (`postId`, `postEmail`),
  CONSTRAINT `postEmail` FOREIGN KEY (`postEmail`) REFERENCES `users` (`email`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `Notifications` (
  `notificationId` int(11) NOT NULL AUTO_INCREMENT,
  `notifEmail` varchar(45) NOT NULL,
  `nDesc` varchar(45) NOT NULL,
  `email2` varchar(45) NULL,
  `notifGroupId` int(11) NOT NULL,
  PRIMARY KEY (`notificationId`),
  CONSTRAINT `notifEmail` FOREIGN KEY (`notifEmail`) REFERENCES `users` (`email`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `notifGroupId` FOREIGN KEY (`notifGroupId`) REFERENCES `groups` (`groupId`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

CREATE TABLE `Friends` (
  `email1` varchar(45) NOT NULL,
  `email2` varchar(45) NOT NULL,
  PRIMARY KEY (`email1`,`email2`),
  KEY `email_idx` (`email1`),
  CONSTRAINT `email1` FOREIGN KEY (`email1`) REFERENCES `users` (`email`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `email2` FOREIGN KEY (`email2`) REFERENCES `users` (`email`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `email` varchar(50) NOT NULL,
  `firstName` varchar(45) NOT NULL,
  `lastName` varchar(45) NOT NULL,
  `password` varchar(45) NOT NULL,
  `gender` varchar(6) NOT NULL,
  `dob` DATE NOT NULL,
  `lastLogin` datetime DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;


/* Insert scripts*/
insert into users values('p@ravi','Priyanka','Ravikanti','test','female','2012-08-08',null);
insert into users values('m@gell','Monica','Geller','test','female','2012-08-08',null);
insert into users values('p@buff','Pheobe','Buffae','test','female','2012-08-08',null);
insert into users values('r@gree','Rachel','Green','test','female','2012-08-08',null);
insert into users values('r@gell','Ross','Geller','test','male','2012-08-08',null);
insert into users values('j@snow','John','Snow','test','male','2012-08-08',null);
insert into users values('j@trib','Joey','Tribbiani','test','male','2012-08-08',null);
insert into users values('c@bing','Chandler','Bing','test','male','2012-08-08',null);


INSERT INTO `test`.`groups` (`name`) VALUES ('Friends');
INSERT INTO `test`.`groups` (`name`) VALUES ('SJSU');


INSERT INTO `test`.`usergroups` (`groupId`, `email`) VALUES ('5', 'r@gree');
INSERT INTO `test`.`usergroups` (`groupId`, `email`) VALUES ('5', 'r@gell');
INSERT INTO `test`.`usergroups` (`groupId`, `email`) VALUES ('5', 'm@gell');
INSERT INTO `test`.`usergroups` (`groupId`, `email`) VALUES ('5', 'j@trib');
INSERT INTO `test`.`usergroups` (`groupId`, `email`) VALUES ('5', 'c@bing');
INSERT INTO `test`.`usergroups` (`groupId`, `email`) VALUES ('7', 'j@snow');
INSERT INTO `test`.`usergroups` (`groupId`, `email`) VALUES ('6', 'p@ravi');
INSERT INTO `test`.`usergroups` (`groupId`, `email`) VALUES ('5', 'p@buff');

INSERT INTO `test`.`friends` (`email1`, `email2`) VALUES ('p@ravi', 'm@gell');
INSERT INTO `test`.`friends` (`email1`, `email2`) VALUES ('p@ravi', 'r@gree');
INSERT INTO `test`.`friends` (`email1`, `email2`) VALUES ('r@gree', 'p@ravi');
INSERT INTO `test`.`friends` (`email1`, `email2`) VALUES ('m@gell', 'p@ravi');

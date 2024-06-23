-- MariaDB dump 10.19  Distrib 10.5.22-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: kjb22_security
-- ------------------------------------------------------
-- Server version	10.5.22-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `group_join_requests`
--

DROP TABLE IF EXISTS `group_join_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_join_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `group_join_requests_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`),
  CONSTRAINT `group_join_requests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_join_requests`
--

LOCK TABLES `group_join_requests` WRITE;
/*!40000 ALTER TABLE `group_join_requests` DISABLE KEYS */;
INSERT INTO `group_join_requests` VALUES (13,48,52,'accepted','2023-11-18 19:39:29');
/*!40000 ALTER TABLE `group_join_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_members`
--

DROP TABLE IF EXISTS `group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_members` (
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `public_key` text DEFAULT NULL,
  PRIMARY KEY (`group_id`,`user_id`),
  CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_members`
--

LOCK TABLES `group_members` WRITE;
/*!40000 ALTER TABLE `group_members` DISABLE KEYS */;
INSERT INTO `group_members` VALUES (48,51,NULL),(48,52,NULL),(49,52,NULL);
/*!40000 ALTER TABLE `group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `current_key` text DEFAULT NULL,
  `group_code` varchar(255) DEFAULT NULL,
  `group_key` blob DEFAULT NULL,
  `iv` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_code` (`group_code`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (48,'group1',NULL,'7qiOsx','RDOªäeO]ïz@ÛÅ\"ÁÏfþæ÷Ø­V³',NULL),(49,'group2',NULL,'CdrU86','JS¿3³ß:Õtï\rÉø6zêèRë\"£2\\ÃD|',NULL);
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `iv` varchar(255) DEFAULT NULL,
  `tag` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`),
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (11,48,51,'RrMJsHs3D07Sqj+e2CQqao9vXXaDH0A+NDDmjmXH8C4eukm9qp8K','2023-11-18 19:41:53','UVlWdJg9NLQo0WCA','/FXlH/L36lj3/QIJ3YrUTA=='),(12,48,52,'XeI1XOXJJk6OLJ4z8iskcSeZgzud6WQ=','2023-11-18 19:47:13','lOeXwl+w3JQi9eWb','LMSCwz5izYghtVF1VDIJhA==');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `public_key` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (51,'anonym','$2a$10$vD67k9Vh/ZHKJhtQftbmFOymRm4f5nHpbes23.xak5vnHUKBsn7V2','2023-11-18 19:37:44','-----BEGIN PUBLIC KEY-----\r\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvOf6hetyvdyKXbba7NBi\r\nbSbQpP9WhGTyPRz/NQrbio3z+ERko/o9qlORV5waqUNXxs6YpSejDlkfNPdTXYRG\r\nEvmL90endN1Fuoa4jfIQFe0BJpfhBdsG3mWEOnZYY4qDuT0ZU7EoYM3JYnudA6xF\r\nuESFddFc18vdTl3WjrsvY1mCh/T2W/jilqVR8TFGWy2zfE6eZNr2wuLzl8lUp3Sa\r\nK8BEdnAboviAYciJg4fIZiFGEGVZuuJN3rJVXKRO4oXDt/cflh3dAmuL/InjxrNN\r\n0vGlH78sEzPTYX9IOSvL9jmX1RHE4PiPyLRyENE1GCrKZzVWWxY7tY4kyqid4dGs\r\n4QIDAQAB\r\n-----END PUBLIC KEY-----\r\n'),(52,'anonym2','$2a$10$lLYaNgjz5/RPHR5dORuofunf.RIa1zLYAK9wNIuUlPJC.Yl8MwrNO','2023-11-18 19:38:50','-----BEGIN PUBLIC KEY-----\r\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoz7Fd1CuOw25lxp7SBdS\r\n36hyTJ/Y4xdl0aKpWuu+NBmcWj4JUWk7DaTS6ERujzF6gYGJ8hkF65bh22+CP1Uf\r\neoAe8M+zRnmUI4Qam1S089XsFlpCIiJln0HYMxR/KFSed3HNUBROt/lvo6mvgK09\r\nkKVFIlYkJvo/nnxw7xyFGPRlCxwFuskki06BmUA0gJWFpEfsmEG/9KlDX4/hL/y3\r\nic4fgW3pkJ2r5wU6LnuXWBNlAvy7hN0U35vjYiy9PdKOGSMlekKSKWSNmAEnBL2R\r\nVUuEkp3DePB5mbtssz15XxSkh+NdHmLyPutAQjAtqAXrw0pBz16cQzsPmcjbG7OR\r\nYQIDAQAB\r\n-----END PUBLIC KEY-----\r\n');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-11-18 20:34:23
